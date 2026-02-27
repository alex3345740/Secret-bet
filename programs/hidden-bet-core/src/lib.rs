use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};

declare_id!("2DVDuGDWRMhwvSPcyCWz5sAft2T1Dt1tgQio6cUgNDVh");

pub const PLATFORM_CONFIG_SEED: &[u8] = b"platform_config";
pub const TREASURY_VAULT_SEED: &[u8] = b"treasury_vault";
pub const PLAYER_PROFILE_SEED: &[u8] = b"player_profile";
pub const PLAYER_SESSION_SEED: &[u8] = b"player_session";
pub const PLAYER_PRIVATE_LEDGER_V2_SEED: &[u8] = b"player_private_ledger_v2";
pub const ROUND_STATE_SEED: &[u8] = b"round_state";
pub const SETTLEMENT_RECEIPT_SEED: &[u8] = b"settlement_receipt";

#[ephemeral]
#[program]
pub mod hidden_bet_core {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        args: InitializePlatformArgs,
    ) -> Result<()> {
        require!(
            args.max_exposure_bps <= 10_000,
            HiddenBetCoreError::InvalidExposureLimit
        );

        let config = &mut ctx.accounts.platform_config;
        config.admin = ctx.accounts.admin.key();
        config.treasury_sol_vault = args.treasury_sol_vault;
        config.treasury_usdc_vault = args.treasury_usdc_vault;
        config.vrf_queue = args.vrf_queue;
        config.er_validator_identity = args.er_validator_identity;
        config.max_exposure_bps = args.max_exposure_bps;
        config.paused = false;
        config.bump = ctx.bumps.platform_config;

        emit!(PlatformInitialized {
            admin: config.admin,
            max_exposure_bps: config.max_exposure_bps,
            vrf_queue: config.vrf_queue,
            er_validator_identity: config.er_validator_identity,
        });

        Ok(())
    }

    pub fn update_platform_runtime(
        ctx: Context<UpdatePlatformRuntime>,
        args: UpdatePlatformRuntimeArgs,
    ) -> Result<()> {
        require!(
            args.max_exposure_bps <= 10_000,
            HiddenBetCoreError::InvalidExposureLimit
        );

        let config = &mut ctx.accounts.platform_config;
        config.vrf_queue = args.vrf_queue;
        config.er_validator_identity = args.er_validator_identity;
        config.max_exposure_bps = args.max_exposure_bps;
        config.paused = args.paused;

        emit!(PlatformRuntimeUpdated {
            admin: config.admin,
            max_exposure_bps: config.max_exposure_bps,
            vrf_queue: config.vrf_queue,
            er_validator_identity: config.er_validator_identity,
            paused: config.paused,
        });

        Ok(())
    }

    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let profile = &mut ctx.accounts.player_profile;
        profile.player = ctx.accounts.player.key();
        profile.created_at = now;
        profile.rounds_played = 0;
        profile.net_pnl_commitment = [0_u8; 32];
        profile.bump = ctx.bumps.player_profile;

        emit!(PlayerInitialized {
            player: profile.player,
            created_at: profile.created_at,
        });

        Ok(())
    }

    pub fn open_player_session(
        ctx: Context<OpenPlayerSession>,
        args: OpenPlayerSessionArgs,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(
            args.expires_at > now,
            HiddenBetCoreError::InvalidSessionExpiry
        );

        let session = &mut ctx.accounts.player_session;
        session.player = ctx.accounts.player.key();
        session.nonce = args.session_nonce;
        session.opened_at = now;
        session.expires_at = args.expires_at;
        session.bump = ctx.bumps.player_session;

        emit!(PlayerSessionOpened {
            player: session.player,
            nonce: session.nonce,
            expires_at: session.expires_at,
        });

        Ok(())
    }

    pub fn delegate_player_context(
        ctx: Context<DelegatePlayerContext>,
        session_nonce: u64,
    ) -> Result<()> {
        ctx.accounts.delegate_player_session(
            &ctx.accounts.payer,
            &[PLAYER_SESSION_SEED, ctx.accounts.player.key().as_ref(), &session_nonce.to_le_bytes()],
            DelegateConfig {
                validator: ctx.remaining_accounts.first().map(|acc| acc.key()),
                commit_frequency_ms: 0,
            },
        )?;

        emit!(ContextDelegated {
            player: ctx.accounts.player.key(),
            context: ctx.accounts.player_session.key(),
        });

        Ok(())
    }

    pub fn commit_player_context(ctx: Context<CommitPlayerContext>) -> Result<()> {
        commit_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.player_session.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;

        emit!(ContextCommitted {
            player: ctx.accounts.player.key(),
            context: ctx.accounts.player_session.key(),
        });

        Ok(())
    }

    pub fn commit_and_undelegate_player_context(
        ctx: Context<CommitAndUndelegatePlayerContext>,
    ) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.player_session.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;

        emit!(ContextUndelegated {
            player: ctx.accounts.player.key(),
            context: ctx.accounts.player_session.key(),
        });

        Ok(())
    }

    pub fn initialize_private_ledger_v2(ctx: Context<InitializePrivateLedgerV2>) -> Result<()> {
        let ledger = &mut ctx.accounts.player_private_ledger_v2;
        ledger.player = ctx.accounts.player.key();
        ledger.balance_commitment = [0_u8; 32];
        ledger.last_settlement_commitment = [0_u8; 32];
        ledger.last_settlement_nonce = 0;
        ledger.pending_withdraw_commitment = [0_u8; 32];
        ledger.pending_withdraw_nonce = 0;
        ledger.pending_withdraw_expires_at = 0;
        ledger.bump = ctx.bumps.player_private_ledger_v2;

        emit!(PrivateLedgerInitializedV2 {
            player: ledger.player,
            ledger: ctx.accounts.player_private_ledger_v2.key(),
        });

        Ok(())
    }

    pub fn apply_private_round_delta_v2(
        ctx: Context<ApplyPrivateRoundDeltaV2>,
        args: ApplyPrivateRoundDeltaV2Args,
    ) -> Result<()> {
        let ledger = &mut ctx.accounts.player_private_ledger_v2;
        require_keys_eq!(
            ledger.player,
            ctx.accounts.player.key(),
            HiddenBetCoreError::UnauthorizedLedgerMutation
        );

        let expected_nonce = ledger
            .last_settlement_nonce
            .checked_add(1)
            .ok_or(HiddenBetCoreError::LedgerOverflow)?;
        require!(
            args.settlement_nonce == expected_nonce,
            HiddenBetCoreError::InvalidSettlementNonce
        );

        ledger.balance_commitment = args.balance_commitment;
        ledger.last_settlement_commitment = args.settlement_commitment;
        ledger.last_settlement_nonce = args.settlement_nonce;

        emit!(PrivateRoundDeltaAppliedV2 {
            player: ledger.player,
            settlement_commitment: ledger.last_settlement_commitment,
            settlement_nonce: ledger.last_settlement_nonce,
            balance_commitment: ledger.balance_commitment,
        });

        Ok(())
    }

    pub fn request_withdraw_private_v2(
        ctx: Context<RequestWithdrawPrivateV2>,
        args: RequestWithdrawPrivateV2Args,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(
            args.expires_at > now,
            HiddenBetCoreError::InvalidWithdrawExpiry
        );

        let ledger = &mut ctx.accounts.player_private_ledger_v2;
        require_keys_eq!(
            ledger.player,
            ctx.accounts.player.key(),
            HiddenBetCoreError::UnauthorizedLedgerMutation
        );
        require!(
            args.nonce == ledger.pending_withdraw_nonce,
            HiddenBetCoreError::WithdrawNonceMismatch
        );

        ledger.pending_withdraw_commitment = args.withdraw_commitment;
        ledger.pending_withdraw_nonce = args.nonce;
        ledger.pending_withdraw_expires_at = args.expires_at;

        emit!(PrivateWithdrawRequestedV2 {
            player: ledger.player,
            withdraw_commitment: ledger.pending_withdraw_commitment,
            nonce: ledger.pending_withdraw_nonce,
            expires_at: ledger.pending_withdraw_expires_at,
        });

        Ok(())
    }

    pub fn finalize_withdraw_private_v2(
        ctx: Context<FinalizeWithdrawPrivateV2>,
        expected_commitment: [u8; 32],
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let ledger = &mut ctx.accounts.player_private_ledger_v2;
        require_keys_eq!(
            ledger.player,
            ctx.accounts.player.key(),
            HiddenBetCoreError::UnauthorizedLedgerMutation
        );
        require!(
            ledger.pending_withdraw_commitment == expected_commitment,
            HiddenBetCoreError::WithdrawCommitmentMismatch
        );
        require!(
            ledger.pending_withdraw_expires_at > now,
            HiddenBetCoreError::WithdrawIntentExpired
        );

        ledger.pending_withdraw_commitment = [0_u8; 32];
        ledger.pending_withdraw_nonce = ledger
            .pending_withdraw_nonce
            .checked_add(1)
            .ok_or(HiddenBetCoreError::LedgerOverflow)?;
        ledger.pending_withdraw_expires_at = 0;

        emit!(PrivateWithdrawFinalizedV2 {
            player: ledger.player,
            nonce: ledger.pending_withdraw_nonce,
        });

        Ok(())
    }

    pub fn delegate_private_ledger_context_v2(ctx: Context<DelegatePrivateLedgerContextV2>) -> Result<()> {
        let player_key = ctx.accounts.player.key();
        ctx.accounts.delegate_player_private_ledger_v2(
            &ctx.accounts.payer,
            &[PLAYER_PRIVATE_LEDGER_V2_SEED, player_key.as_ref()],
            DelegateConfig {
                validator: ctx.remaining_accounts.first().map(|acc| acc.key()),
                commit_frequency_ms: 0,
            },
        )?;

        emit!(ContextDelegated {
            player: player_key,
            context: ctx.accounts.player_private_ledger_v2.key(),
        });

        Ok(())
    }

    pub fn commit_and_undelegate_private_ledger_context_v2(
        ctx: Context<CommitAndUndelegatePrivateLedgerContextV2>,
    ) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.player_private_ledger_v2.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;

        emit!(ContextUndelegated {
            player: ctx.accounts.player.key(),
            context: ctx.accounts.player_private_ledger_v2.key(),
        });

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct InitializePlatformArgs {
    pub treasury_sol_vault: Pubkey,
    pub treasury_usdc_vault: Pubkey,
    pub vrf_queue: Pubkey,
    pub er_validator_identity: Pubkey,
    pub max_exposure_bps: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct UpdatePlatformRuntimeArgs {
    pub vrf_queue: Pubkey,
    pub er_validator_identity: Pubkey,
    pub max_exposure_bps: u16,
    pub paused: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct OpenPlayerSessionArgs {
    pub session_nonce: u64,
    pub expires_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct ApplyPrivateRoundDeltaV2Args {
    pub balance_commitment: [u8; 32],
    pub settlement_commitment: [u8; 32],
    pub settlement_nonce: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct RequestWithdrawPrivateV2Args {
    pub withdraw_commitment: [u8; 32],
    pub nonce: u64,
    pub expires_at: i64,
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [PLATFORM_CONFIG_SEED],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + PlayerProfile::INIT_SPACE,
        seeds = [PLAYER_PROFILE_SEED, player.key().as_ref()],
        bump
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: OpenPlayerSessionArgs)]
pub struct OpenPlayerSession<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [PLAYER_PROFILE_SEED, player.key().as_ref()],
        bump = player_profile.bump
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + PlayerSession::INIT_SPACE,
        seeds = [PLAYER_SESSION_SEED, player.key().as_ref(), &args.session_nonce.to_le_bytes()],
        bump
    )]
    pub player_session: Account<'info, PlayerSession>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePlatformRuntime<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [PLATFORM_CONFIG_SEED],
        bump = platform_config.bump,
        has_one = admin
    )]
    pub platform_config: Account<'info, PlatformConfig>,
}

#[delegate]
#[derive(Accounts)]
#[instruction(session_nonce: u64)]
pub struct DelegatePlayerContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: account whose key is used in PDA derivation.
    pub player: UncheckedAccount<'info>,
    /// CHECK: checked by delegation program and PDA constraints.
    #[account(
        mut,
        del,
        seeds = [PLAYER_SESSION_SEED, player.key().as_ref(), &session_nonce.to_le_bytes()],
        bump = player_session.bump
    )]
    pub player_session: Account<'info, PlayerSession>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitPlayerContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: account whose key is used in PDA derivation.
    pub player: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [PLAYER_SESSION_SEED, player.key().as_ref(), &player_session.nonce.to_le_bytes()],
        bump = player_session.bump
    )]
    pub player_session: Account<'info, PlayerSession>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitAndUndelegatePlayerContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: account whose key is used in PDA derivation.
    pub player: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [PLAYER_SESSION_SEED, player.key().as_ref(), &player_session.nonce.to_le_bytes()],
        bump = player_session.bump
    )]
    pub player_session: Account<'info, PlayerSession>,
}

#[derive(Accounts)]
pub struct InitializePrivateLedgerV2<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + PlayerPrivateLedgerV2::INIT_SPACE,
        seeds = [PLAYER_PRIVATE_LEDGER_V2_SEED, player.key().as_ref()],
        bump
    )]
    pub player_private_ledger_v2: Account<'info, PlayerPrivateLedgerV2>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApplyPrivateRoundDeltaV2<'info> {
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [PLAYER_PRIVATE_LEDGER_V2_SEED, player.key().as_ref()],
        bump = player_private_ledger_v2.bump
    )]
    pub player_private_ledger_v2: Account<'info, PlayerPrivateLedgerV2>,
}

#[derive(Accounts)]
pub struct RequestWithdrawPrivateV2<'info> {
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [PLAYER_PRIVATE_LEDGER_V2_SEED, player.key().as_ref()],
        bump = player_private_ledger_v2.bump
    )]
    pub player_private_ledger_v2: Account<'info, PlayerPrivateLedgerV2>,
}

#[derive(Accounts)]
pub struct FinalizeWithdrawPrivateV2<'info> {
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [PLAYER_PRIVATE_LEDGER_V2_SEED, player.key().as_ref()],
        bump = player_private_ledger_v2.bump
    )]
    pub player_private_ledger_v2: Account<'info, PlayerPrivateLedgerV2>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegatePrivateLedgerContextV2<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: account whose key is used in PDA derivation.
    pub player: UncheckedAccount<'info>,
    /// CHECK: checked by delegation program and PDA constraints.
    #[account(
        mut,
        del,
        seeds = [PLAYER_PRIVATE_LEDGER_V2_SEED, player.key().as_ref()],
        bump = player_private_ledger_v2.bump
    )]
    pub player_private_ledger_v2: Account<'info, PlayerPrivateLedgerV2>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitAndUndelegatePrivateLedgerContextV2<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: account whose key is used in PDA derivation.
    pub player: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [PLAYER_PRIVATE_LEDGER_V2_SEED, player.key().as_ref()],
        bump = player_private_ledger_v2.bump
    )]
    pub player_private_ledger_v2: Account<'info, PlayerPrivateLedgerV2>,
}

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub admin: Pubkey,
    pub treasury_sol_vault: Pubkey,
    pub treasury_usdc_vault: Pubkey,
    pub vrf_queue: Pubkey,
    pub er_validator_identity: Pubkey,
    pub max_exposure_bps: u16,
    pub paused: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct TreasuryVault {
    pub asset_mint: Pubkey,
    pub liquidity_commitment: [u8; 32],
    pub exposure_commitment: [u8; 32],
    pub accounting_commitment: [u8; 32],
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    pub player: Pubkey,
    pub created_at: i64,
    pub rounds_played: u64,
    pub net_pnl_commitment: [u8; 32],
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PlayerSession {
    pub player: Pubkey,
    pub nonce: u64,
    pub opened_at: i64,
    pub expires_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PlayerPrivateLedgerV2 {
    pub player: Pubkey,
    pub balance_commitment: [u8; 32],
    pub last_settlement_commitment: [u8; 32],
    pub last_settlement_nonce: u64,
    pub pending_withdraw_commitment: [u8; 32],
    pub pending_withdraw_nonce: u64,
    pub pending_withdraw_expires_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct RoundState {
    pub player: Pubkey,
    pub game_type: u8,
    pub round_id: u64,
    pub status: u8,
    pub round_commitment: [u8; 32],
    pub request_hash: [u8; 32],
    pub outcome_commitment: [u8; 32],
    pub settlement_commitment: [u8; 32],
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct SettlementReceipt {
    pub round_id: u64,
    pub player: Pubkey,
    pub game_type: u8,
    pub settlement_commitment: [u8; 32],
    pub outcome_commitment: [u8; 32],
    pub receipt_commitment: [u8; 32],
    pub vrf_proof_hash: [u8; 32],
    pub settled_at: i64,
    pub final_state: u8,
    pub bump: u8,
}

#[event]
pub struct PlatformInitialized {
    pub admin: Pubkey,
    pub max_exposure_bps: u16,
    pub vrf_queue: Pubkey,
    pub er_validator_identity: Pubkey,
}

#[event]
pub struct PlatformRuntimeUpdated {
    pub admin: Pubkey,
    pub max_exposure_bps: u16,
    pub vrf_queue: Pubkey,
    pub er_validator_identity: Pubkey,
    pub paused: bool,
}

#[event]
pub struct PlayerInitialized {
    pub player: Pubkey,
    pub created_at: i64,
}

#[event]
pub struct PlayerSessionOpened {
    pub player: Pubkey,
    pub nonce: u64,
    pub expires_at: i64,
}

#[event]
pub struct ContextDelegated {
    pub player: Pubkey,
    pub context: Pubkey,
}

#[event]
pub struct ContextCommitted {
    pub player: Pubkey,
    pub context: Pubkey,
}

#[event]
pub struct ContextUndelegated {
    pub player: Pubkey,
    pub context: Pubkey,
}

#[event]
pub struct PrivateLedgerInitializedV2 {
    pub player: Pubkey,
    pub ledger: Pubkey,
}

#[event]
pub struct PrivateRoundDeltaAppliedV2 {
    pub player: Pubkey,
    pub settlement_commitment: [u8; 32],
    pub settlement_nonce: u64,
    pub balance_commitment: [u8; 32],
}

#[event]
pub struct PrivateWithdrawRequestedV2 {
    pub player: Pubkey,
    pub withdraw_commitment: [u8; 32],
    pub nonce: u64,
    pub expires_at: i64,
}

#[event]
pub struct PrivateWithdrawFinalizedV2 {
    pub player: Pubkey,
    pub nonce: u64,
}

#[error_code]
pub enum HiddenBetCoreError {
    #[msg("Session expiration must be in the future.")]
    InvalidSessionExpiry,
    #[msg("Max exposure basis points must be <= 10_000.")]
    InvalidExposureLimit,
    #[msg("Ledger mutation is not authorized for this player.")]
    UnauthorizedLedgerMutation,
    #[msg("Private ledger arithmetic overflowed.")]
    LedgerOverflow,
    #[msg("Settlement nonce must increase strictly by one.")]
    InvalidSettlementNonce,
    #[msg("Withdraw intent expiry must be in the future.")]
    InvalidWithdrawExpiry,
    #[msg("Withdraw nonce does not match the current pending nonce.")]
    WithdrawNonceMismatch,
    #[msg("Withdraw commitment does not match the pending intent.")]
    WithdrawCommitmentMismatch,
    #[msg("Withdraw intent has already expired.")]
    WithdrawIntentExpired,
}
