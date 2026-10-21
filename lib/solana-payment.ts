import { Buffer } from 'buffer';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';

const TOKEN = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// The checkout allowlist contains only classic SPL USDC/USDT. Encode the two
// standard instructions without the full token-extension SDK/native bigint
// dependency. Layouts: spl-token TransferChecked and ATA CreateIdempotent.
export function tokenPaymentInstructions(from: PublicKey, to: PublicKey, mint: PublicKey, amount: bigint, decimals: number): TransactionInstruction[] {
  if (amount <= BigInt(0) || amount > BigInt('18446744073709551615') || decimals !== 6) throw new Error('Unsupported SPL payment amount');
  const ata = (owner: PublicKey) => PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN.toBuffer(), mint.toBuffer()], ASSOCIATED)[0];
  const source = ata(from);
  const destination = ata(to);
  const data = Buffer.alloc(10);
  data[0] = 12; // TransferChecked
  data.writeBigUInt64LE(amount, 1);
  data[9] = decimals;
  return [
    new TransactionInstruction({
      programId: ASSOCIATED, data: Buffer.from([1]),
      keys: [
        { pubkey: from, isSigner: true, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN, isSigner: false, isWritable: false },
      ],
    }),
    new TransactionInstruction({
      programId: TOKEN, data,
      keys: [
        { pubkey: source, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: destination, isSigner: false, isWritable: true },
        { pubkey: from, isSigner: true, isWritable: false },
      ],
    }),
  ];
}
