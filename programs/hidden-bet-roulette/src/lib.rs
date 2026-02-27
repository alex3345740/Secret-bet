use anchor_lang::prelude::*;
use ephemeral_vrf_sdk::anchor::vrf;
use ephemeral_vrf_sdk::instructions::{create_request_randomness_ix, RequestRandomnessParams};
use ephemeral_vrf_sdk::types::SerializableAccountMeta;
use hidden_bet_core::{PlatformConfig, PLATFORM_CONFIG_SEED};
use sha2::{Digest, Sha256};

declare_id!("iFTY1vz8n1c24Sb9EWXkvzYJFsSH7yvdaYYsbE5MGcD");

pub const ROULETTE_ROUND_SEED: &[u8] = b"roulette_round";
pub const GAME_TYPE_ROULETTE: u8 = 2;
pub const STATUS_CREATED: u8 = 0;
pub const STATUS_BET_LOCKED: u8 = 1;
pub const STATUS_RANDOMNESS_PENDING: u8 = 2;
pub const STATUS_RANDOMNESS_DELIVERED: u8 = 3;
pub const STATUS_SETTLED: u8 = 4;

#[program]
pub mod hidden_bet_roulette {
    use super::*;

    pub fn create_round_roulette(
        ctx: Context<CreateRoundRoulette>,
        args: CreateRoundRouletteArgs,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let round = &mut ctx.accounts.round;
        round.round_id = args.round_id;
        round.player = ctx.accounts.player.key();
        round.config_commitment = args.config_commitment;
        round.status = STATUS_CREATED;
        round.created_at = now;
        round.updated_at = now;
        round.bump = ctx.bumps.round;

        emit!(RoundCreated {
            round_id: round.round_id,
            player: round.player,
            game_type: GAME_TYPE_ROULETTE,
        });

        Ok(())
    }

    pub fn place_private_bet_roulette(
        ctx: Context<PlacePrivateBetRoulette>,
        args: PlacePrivateBetRouletteArgs,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let round = &mut ctx.accounts.round;

        require!(
            round.status == STATUS_CREATED,
            HiddenBetRouletteError::InvalidRoundStatus
        );
        require_keys_eq!(
            round.player,
            ctx.accounts.player.key(),
            HiddenBetRouletteError::Unauthorized
        );

        round.bet_commitment = args.bet_commitment;
        round.private_payload_hash = args.private_payload_hash;
        round.board_commitment = args.board_commitment;
        round.status = STATUS_BET_LOCKED;
        round.updated_at = now;

        emit!(PrivateBetPlaced {
            round_id: round.round_id,
            player: round.player,
            commitment: round.bet_commitment,
        });

        Ok(())
    }

    pub fn request_randomness_roulette(
        ctx: Context<RequestRandomnessRoulette>,
        client_seed: [u8; 32],
    ) -> Result<()> {
        let round = &ctx.accounts.round;
        require!(
            round.status == STATUS_BET_LOCKED,
            HiddenBetRouletteError::InvalidRoundStatus
        );
        require_keys_eq!(
            ctx.accounts.oracle_queue.key(),
            ctx.accounts.platform_config.vrf_queue,
            HiddenBetRouletteError::InvalidOracleQueue
        );

        let player_key = ctx.accounts.player.key();
        let round_key = round.key();
        let round_id = round.round_id;
        let now = Clock::get()?.unix_timestamp;
        let request_hash = hash_concat(&[
            &client_seed[..],
            &round_id.to_le_bytes()[..],
            &player_key.to_bytes()[..],
            &round.config_commitment[..],
            &round.board_commitment[..],
            &round.bet_commitment[..],
        ]);

        let ix = create_request_randomness_ix(RequestRandomnessParams {
            payer: player_key,
            oracle_queue: ctx.accounts.oracle_queue.key(),
            callback_program_id: ID,
            callback_discriminator: instruction::ConsumeRandomnessCallbackRoulette::DISCRIMINATOR
                .to_vec(),
            caller_seed: client_seed,
            accounts_metas: Some(vec![SerializableAccountMeta {
                pubkey: round_key,
                is_signer: false,
                is_writable: true,
            }]),
            ..Default::default()
        });

        ctx.accounts
            .invoke_signed_vrf(&ctx.accounts.player.to_account_info(), &ix)?;

        let round = &mut ctx.accounts.round;
        round.request_hash = request_hash;
        round.status = STATUS_RANDOMNESS_PENDING;
        round.updated_at = now;

        emit!(RandomnessRequested {
            round_id: round.round_id,
            request_hash: round.request_hash,
        });

        Ok(())
    }

    pub fn consume_randomness_callback_roulette(
        ctx: Context<ConsumeRandomnessCallbackRoulette>,
        randomness: [u8; 32],
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let round = &mut ctx.accounts.round;

        require!(
            round.status == STATUS_RANDOMNESS_PENDING,
            HiddenBetRouletteError::InvalidRoundStatus
        );
        require!(
            !round.randomness_consumed,
            HiddenBetRouletteError::ReplayDetected
        );

        round.randomness_hash = hash_concat(&[&randomness[..]]);
        round.randomness_consumed = true;
        round.status = STATUS_RANDOMNESS_DELIVERED;
        round.updated_at = now;

        emit!(RandomnessConsumed {
            round_id: round.round_id,
            randomness_hash: round.randomness_hash,
        });

        Ok(())
    }

    pub fn settle_round_roulette(
        ctx: Context<SettleRoundRoulette>,
        args: SettleRoundRouletteArgs,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let round = &mut ctx.accounts.round;

        require!(
            round.status == STATUS_RANDOMNESS_DELIVERED,
            HiddenBetRouletteError::InvalidRoundStatus
        );

        round.outcome_commitment = args.outcome_commitment;
        round.settlement_commitment = args.settlement_commitment;
        round.status = STATUS_SETTLED;
        round.updated_at = now;

        emit!(RoundSettled {
            round_id: round.round_id,
            outcome_hash: round.outcome_commitment,
            final_state: round.status,
            settled_at: now,
        });
        emit!(SettlementCommitted {
            round_id: round.round_id,
            player: round.player,
            settlement_commitment: round.settlement_commitment,
        });

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct CreateRoundRouletteArgs {
    pub round_id: u64,
    pub config_commitment: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct PlacePrivateBetRouletteArgs {
    pub bet_commitment: [u8; 32],
    pub private_payload_hash: [u8; 32],
    pub board_commitment: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct SettleRoundRouletteArgs {
    pub outcome_commitment: [u8; 32],
    pub settlement_commitment: [u8; 32],
}

#[derive(Accounts)]
#[instruction(args: CreateRoundRouletteArgs)]
pub struct CreateRoundRoulette<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init,
        payer = player,
        space = 8 + RouletteRound::INIT_SPACE,
        seeds = [ROULETTE_ROUND_SEED, player.key().as_ref(), &args.round_id.to_le_bytes()],
        bump
    )]
    pub round: Account<'info, RouletteRound>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlacePrivateBetRoulette<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [ROULETTE_ROUND_SEED, player.key().as_ref(), &round.round_id.to_le_bytes()],
        bump = round.bump
    )]
    pub round: Account<'info, RouletteRound>,
}

#[vrf]
#[derive(Accounts)]
pub struct RequestRandomnessRoulette<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [ROULETTE_ROUND_SEED, player.key().as_ref(), &round.round_id.to_le_bytes()],
        bump = round.bump
    )]
    pub round: Account<'info, RouletteRound>,
    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump = platform_config.bump,
        seeds::program = hidden_bet_core::ID
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    /// CHECK: queue is validated against platform_config.vrf_queue.
    #[account(mut)]
    pub oracle_queue: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ConsumeRandomnessCallbackRoulette<'info> {
    /// CHECK: callback identity for MagicBlock VRF signer.
    #[account(address = ephemeral_vrf_sdk::consts::VRF_PROGRAM_IDENTITY)]
    pub vrf_program_identity: Signer<'info>,
    #[account(mut)]
    pub round: Account<'info, RouletteRound>,
}

#[derive(Accounts)]
pub struct SettleRoundRoulette<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [ROULETTE_ROUND_SEED, player.key().as_ref(), &round.round_id.to_le_bytes()],
        bump = round.bump
    )]
    pub round: Account<'info, RouletteRound>,
}

#[account]
#[derive(InitSpace)]
pub struct RouletteRound {
    pub round_id: u64,
    pub player: Pubkey,
    pub status: u8,
    pub config_commitment: [u8; 32],
    pub bet_commitment: [u8; 32],
    pub private_payload_hash: [u8; 32],
    pub board_commitment: [u8; 32],
    pub request_hash: [u8; 32],
    pub randomness_hash: [u8; 32],
    pub outcome_commitment: [u8; 32],
    pub settlement_commitment: [u8; 32],
    pub randomness_consumed: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

#[event]
pub struct RoundCreated {
    pub round_id: u64,
    pub player: Pubkey,
    pub game_type: u8,
}

#[event]
pub struct PrivateBetPlaced {
    pub round_id: u64,
    pub player: Pubkey,
    pub commitment: [u8; 32],
}

#[event]
pub struct RandomnessRequested {
    pub round_id: u64,
    pub request_hash: [u8; 32],
}

#[event]
pub struct RandomnessConsumed {
    pub round_id: u64,
    pub randomness_hash: [u8; 32],
}

#[event]
pub struct RoundSettled {
    pub round_id: u64,
    pub outcome_hash: [u8; 32],
    pub final_state: u8,
    pub settled_at: i64,
}

#[event]
pub struct SettlementCommitted {
    pub round_id: u64,
    pub player: Pubkey,
    pub settlement_commitment: [u8; 32],
}

fn hash_concat(parts: &[&[u8]]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    for part in parts {
        hasher.update(part);
    }
    let digest = hasher.finalize();
    let mut output = [0_u8; 32];
    output.copy_from_slice(&digest);
    output
}

#[error_code]
pub enum HiddenBetRouletteError {
    #[msg("Round is not in the expected state.")]
    InvalidRoundStatus,
    #[msg("Caller is not authorized for this round.")]
    Unauthorized,
    #[msg("Randomness callback replay detected.")]
    ReplayDetected,
    #[msg("Oracle queue does not match platform configuration.")]
    InvalidOracleQueue,
}
