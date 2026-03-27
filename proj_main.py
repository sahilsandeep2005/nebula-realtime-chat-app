import java.util.*; 
import java.math.BigInteger; 

public class RSA { 

    static BigInteger power(BigInteger base, BigInteger expo, BigInteger m) { 
        return base.modPow(expo, m); 
    } 

    static BigInteger modInverse(BigInteger e, BigInteger phi) { 
        return e.modInverse(phi); 
    } 

    static void generateKeys(BigInteger[] keys, BigInteger p, BigInteger q, BigInteger e) {  
        BigInteger n = p.multiply(q); 
        System.out.println("Computed n: " + n); 

        BigInteger phi = p.subtract(BigInteger.ONE).multiply(q.subtract(BigInteger.ONE)); 
        System.out.println("Euler's totient function phi(n): " + phi); 

        if (!e.gcd(phi).equals(BigInteger.ONE)) { 
           throw new IllegalArgumentException("e and phi(n) must be coprime"); 
        } 

        BigInteger d = modInverse(e, phi); 
        System.out.println("Computed d: " + d); 

        keys[0] = e;   
        keys[1] = d;   
        keys[2] = n;  
    } 

    static BigInteger encrypt(BigInteger m, BigInteger e, BigInteger n) { 
        return power(m, e, n); 
    } 

    static BigInteger decrypt(BigInteger c, BigInteger d, BigInteger n) { 
        return power(c, d, n); 
    } 

    public static void main(String[] args) { 
        Scanner sc = new Scanner (System.in); 
        BigInteger[] keys = new BigInteger[3]; 

        System.out.println("Enter the value of p: "); 
        String p_str = sc.next(); 

        System.out.println("Enter the value of q: "); 
        String q_str = sc.next(); 

        System.out.println("Enter the value of e: "); 
        String e_str = sc.next(); 

        BigInteger p = new BigInteger(p_str); 
        BigInteger q = new BigInteger(q_str); 
        BigInteger e = new BigInteger(e_str); 

        generateKeys(keys,p,q,e); 

        System.out.println("Public Key (e, n): (" + keys[0] + ", " + keys[2] + ")"); 
        System.out.println("Private Key (d, n): (" + keys[1] + ", " + keys[2] + ")"); 

        BigInteger M = new BigInteger("25"); 
        System.out.println("Original Message: " + M); 

        BigInteger C = encrypt(M, keys[0], keys[2]); 
        System.out.println("Encrypted Message: " + C); 

        BigInteger decrypted = decrypt(C, keys[1], keys[2]); 
        System.out.println("Decrypted Message: " + decrypted); 

        if (M.equals(decrypted)) { 
            System.out.println("Validation successful! Original and decrypted message is same."); 
        } 
        else { 
            System.out.println("Validation unsuccessful! Original and decrypted message is not same."); 
        } 
    } 
}


import java.util.*; 

public class SDES { 
    static int[] P10 = {3,5,2,7,4,10,1,9,8,6}; 
    static int[] P8  = {6,3,7,4,8,5,10,9}; 

    static int[] IP  = {2,6,3,1,4,8,5,7}; 
    static int[] IPi = {4,1,3,5,7,2,8,6}; 

    static int[] EP  = {4,1,2,3,2,3,4,1}; 
    static int[] P4  = {2,4,3,1}; 
 
    static int[][] S0 = { 
        {1,0,3,2}, 
        {3,2,1,0}, 
        {0,2,1,3}, 
        {3,1,3,2} 
    }; 
 
    static int[][] S1 = { 
        {0,1,2,3}, 
        {2,0,1,3}, 
        {3,0,1,0}, 
        {2,1,0,3} 
    }; 
 
    static int[] bits(String s, int n) { 
        s = s.trim(); 
        if (s.length() != n) throw new IllegalArgumentException("Need " + n + " bits."); 
        int[] b = new int[n]; 
        for (int i = 0; i < n; i++) b[i] = s.charAt(i) - '0'; 
        return b; 
    } 
     
    static String str(int[] b){  
        StringBuilder sb=new StringBuilder();  
        for(int x:b) sb.append(x);  
        return sb.toString();  
    } 
     
    static int[] perm(int[] in, int[] p){ 
        int[] out = new int[p.length]; 
        for(int i=0;i<p.length;i++) out[i]=in[p[i]-1]; 
        return out; 
    } 
     
    static int[] xor(int[] a, int[] b){ 
        int[] o=new int[a.length]; 
        for(int i=0;i<a.length;i++) o[i]=a[i]^b[i]; 
        return o; 
    } 
     
    static int[] ls(int[] h, int k){ 
        int n=h.length;  
        int[] o=new int[n]; 
        for(int i=0;i<n;i++) o[i]=h[(i+k)%n]; 
        return o; 
    } 
     
    static int[] cat(int[] a,int[] b){ 
        int[] o=new int[a.length+b.length]; 
        System.arraycopy(a,0,o,0,a.length); 
        System.arraycopy(b,0,o,a.length,b.length); 
        return o; 
    } 
 
    static int[] sbox(int[] in4, int[][] S){ 
        int r = (in4[0]<<1) | in4[3]; 
        int c = (in4[1]<<1) | in4[2]; 
        int v = S[r][c]; 
        return new int[]{ (v>>1)&1, v&1 }; 
    } 
 
    static int[] fk(int[] in8, int[] key8){ 
        int[] L = Arrays.copyOfRange(in8,0,4); 
        int[] R = Arrays.copyOfRange(in8,4,8); 
 
        int[] x = xor(perm(R,EP), key8); 
        int[] a = Arrays.copyOfRange(x,0,4); 
        int[] b = Arrays.copyOfRange(x,4,8); 
 
        int[] sb = cat(sbox(a,S0), sbox(b,S1)); 
        int[] p4 = perm(sb,P4); 
 
        int[] newL = xor(L,p4); 
        return cat(newL,R); 
    } 
 
    static int[] sw(int[] in8){ 
        return cat(Arrays.copyOfRange(in8,4,8), Arrays.copyOfRange(in8,0,4)); 
    } 
 
    static int[][] keygen(int[] key10){ 
        int[] p10 = perm(key10,P10); 
        int[] L = Arrays.copyOfRange(p10,0,5); 
        int[] R = Arrays.copyOfRange(p10,5,10); 
 
        L = ls(L,1); 
        R = ls(R,1); 
        int[] K1 = perm(cat(L,R), P8); 
 
        L = ls(L,2); 
        R = ls(R,2); 
        int[] K2 = perm(cat(L,R), P8); 
 
        return new int[][]{K1,K2}; 
    } 
 
    static int[] encrypt(int[] P, int[] K1, int[] K2){ 
        int[] s = perm(P,IP); 
        s = fk(s,K1); 
        s = sw(s); 
        System.out.println("After first round (fk with K1 and swap) (Encryption): " + str(s)); 
        s = fk(s,K2); 
        return perm(s,IPi); 
    } 
 
    static int[] decrypt(int[] C, int[] K1, int[] K2){ 
        int[] s = perm(C,IP); 
        s = fk(s,K2); 
        s = sw(s); 
        System.out.println("After first round (fk with K2 and swap) (Decryption): " + str(s)); 
        s = fk(s,K1); 
        return perm(s,IPi); 
    } 
 
    public static void main(String[] args){ 
        Scanner sc=new Scanner(System.in); 
     
        System.out.print("Enter 10-bit key: "); 
        int[] K = bits(sc.nextLine(),10); 
 
        System.out.print("Enter 8-bit plaintext: "); 
        int[] P = bits(sc.nextLine(),8); 
 
        int[][] keys = keygen(K); 
        int[] K1 = keys[0], K2 = keys[1]; 
        System.out.println("K1 = " + str(K1)); 
        System.out.println("K2 = " + str(K2)); 
 
        System.out.println("\n--- Encryption Process ---"); 
        int[] C = encrypt(P,K1,K2); 
        System.out.println("Ciphertext (CT) = " + str(C)); 
 
        System.out.println("\n--- Decryption Process ---"); 
        int[] P2 = decrypt(C,K1,K2); 
        System.out.println("Decrypted Plaintext (PT) = " + str(P2)); 
        sc.close(); 
    } 
}


import java.util.Scanner; 

public class DiffieHellman { 
    private static long power(long a, long b, long p) { 
        long res = 1; 
        a %= p; 
        while (b > 0) { 
            if ((b & 1) == 1) res = (res * a) % p; 
            a = (a * a) % p; 
            b >>= 1; 
        } 
        return res; 
    } 
 
    public static void main(String[] args) { 
        Scanner sc = new Scanner(System.in); 
 
        long P, G, a, b, x, y, ka, kb; 
 
        System.out.print("Enter prime number P: "); 
        P = sc.nextLong(); 
 
        System.out.print("Enter primitive root G modulo P: "); 
        G = sc.nextLong(); 
 
        System.out.print("Enter User1 private key a: "); 
        a = sc.nextLong(); 
 
        System.out.print("Enter User2 private key b: "); 
        b = sc.nextLong(); 
 
        x = power(G, a, P); 
        y = power(G, b, P); 
 
        System.out.println("\nUser1 public key (X = G^a mod P) = " + x); 
        System.out.println("User2 public key   (Y = G^b mod P) = " + y); 
 
        ka = power(y, a, P); 
        kb = power(x, b, P); 
 
        System.out.println("\nSecret key for User1 = " + ka); 
        System.out.println("Secret key for User2   = " + kb); 
 
        sc.close(); 
    } 
}


// Aes

SBOX = [ 
0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,
0xab,0x76, 
0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,
0x72,0xc0, 
0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,
0x31,0x15, 
0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,
0xb2,0x75, 
0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,
0x2f,0x84, 
0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,
0x58,0xcf, 
0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,
0x9f,0xa8, 
0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,
0xf3,0xd2, 
0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,
0x19,0x73, 
0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,
0x0b,0xdb, 
0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,
0xe4,0x79, 
0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,
0xae,0x08, 
0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,
0x8b,0x8a, 
0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,
0x1d,0x9e, 
0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,
0x28,0xdf, 
0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,
0xbb,0x16 
] 

INV_SBOX = [ 
0x52,0x09,0x6a,0xd5,0x30,0x36,0xa5,0x38,0xbf,0x40,0xa3,0x9e,0x81,0xf3,
0xd7,0xfb, 
0x7c,0xe3,0x39,0x82,0x9b,0x2f,0xff,0x87,0x34,0x8e,0x43,0x44,0xc4,0xde,
0xe9,0xcb, 
0x54,0x7b,0x94,0x32,0xa6,0xc2,0x23,0x3d,0xee,0x4c,0x95,0x0b,0x42,0xfa,
0xc3,0x4e, 
0x08,0x2e,0xa1,0x66,0x28,0xd9,0x24,0xb2,0x76,0x5b,0xa2,0x49,0x6d,0x8b,
0xd1,0x25, 
0x72,0xf8,0xf6,0x64,0x86,0x68,0x98,0x16,0xd4,0xa4,0x5c,0xcc,0x5d,0x65,
0xb6,0x92, 
0x6c,0x70,0x48,0x50,0xfd,0xed,0xb9,0xda,0x5e,0x15,0x46,0x57,0xa7,0x8d,
0x9d,0x84, 
0x90,0xd8,0xab,0x00,0x8c,0xbc,0xd3,0x0a,0xf7,0xe4,0x58,0x05,0xb8,0xb3,
0x45,0x06, 
0xd0,0x2c,0x1e,0x8f,0xca,0x3f,0x0f,0x02,0xc1,0xaf,0xbd,0x03,0x01,0x13,
0x8a,0x6b, 
0x3a,0x91,0x11,0x41,0x4f,0x67,0xdc,0xea,0x97,0xf2,0xcf,0xce,0xf0,0xb4,
0xe6,0x73, 
0x96,0xac,0x74,0x22,0xe7,0xad,0x35,0x85,0xe2,0xf9,0x37,0xe8,0x1c,0x75,
0xdf,0x6e, 
0x47,0xf1,0x1a,0x71,0x1d,0x29,0xc5,0x89,0x6f,0xb7,0x62,0x0e,0xaa,0x18,
0xbe,0x1b, 
0xfc,0x56,0x3e,0x4b,0xc6,0xd2,0x79,0x20,0x9a,0xdb,0xc0,0xfe,0x78,0xcd,
0x5a,0xf4, 
0x1f,0xdd,0xa8,0x33,0x88,0x07,0xc7,0x31,0xb1,0x12,0x10,0x59,0x27,0x80,
0xec,0x5f, 
0x60,0x51,0x7f,0xa9,0x19,0xb5,0x4a,0x0d,0x2d,0xe5,0x7a,0x9f,0x93,0xc9,
0x9c,0xef, 
0xa0,0xe0,0x3b,0x4d,0xae,0x2a,0xf5,0xb0,0xc8,0xeb,0xbb,0x3c,0x83,0x53,
0x99,0x61, 
0x17,0x2b,0x04,0x7e,0xba,0x77,0xd6,0x26,0xe1,0x69,0x14,0x63,0x55,0x21,
0x0c,0x7d 
] 

RCON = [0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1B,0x36] 

def hex_to_bytes(h: str) -> bytes: 
    h = "".join(h.split()) 
    if len(h) % 2 != 0: 
        raise ValueError("Hex length must be even.") 
    return bytes(int(h[i:i+2], 16) for i in range(0, len(h), 2)) 

def bytes_to_hex(b: bytes) -> str: 
    return "".join(f"{x:02X}" for x in b) 

def pkcs7_pad(data: bytes, block=16) -> bytes: 
    pad = block - (len(data) % block) 
    return data + bytes([pad]) * pad 

def pkcs7_unpad(data: bytes, block=16) -> bytes: 
    if len(data) == 0 or len(data) % block != 0: 
        raise ValueError("Bad padded length.") 
    pad = data[-1] 
    if pad < 1 or pad > block or data[-pad:] != bytes([pad]) * pad: 
        raise ValueError("Bad padding.") 
    return data[:-pad] 

def xtime(a: int) -> int: 
    a &= 0xFF 
    return ((a << 1) ^ (0x1B if (a & 0x80) else 0)) & 0xFF 

def gmul(a: int, b: int) -> int: 
    a &= 0xFF; b &= 0xFF 
    res = 0 
    while b: 
        if b & 1: 
            res ^= a 
        a = xtime(a) 
        b >>= 1 
    return res & 0xFF 

def add_round_key(s, rk): 
    for i in range(16): 
        s[i] ^= rk[i] 

def sub_bytes(s): 
    for i in range(16): 
        s[i] = SBOX[s[i]] 

def inv_sub_bytes(s): 
    for i in range(16): 
        s[i] = INV_SBOX[s[i]] 

def shift_rows(s): 
    t = s[:] 
    s[1], s[5], s[9],  s[13] = t[5],  t[9],  t[13], t[1] 
    s[2], s[6], s[10], s[14] = t[10], t[14], t[2],  t[6] 
    s[3], s[7], s[11], s[15] = t[15], t[3],  t[7],  t[11] 

def inv_shift_rows(s): 
    t = s[:] 
    s[1], s[5], s[9],  s[13] = t[13], t[1],  t[5],  t[9] 
    s[2], s[6], s[10], s[14] = t[10], t[14], t[2],  t[6] 
    s[3], s[7], s[11], s[15] = t[7],  t[11], t[15], t[3] 

def mix_columns(s): 
    for c in range(4): 
        i = 4*c 
        a0,a1,a2,a3 = s[i],s[i+1],s[i+2],s[i+3] 
        s[i]   = gmul(a0,2) ^ gmul(a1,3) ^ a2 ^ a3 
        s[i+1] = a0 ^ gmul(a1,2) ^ gmul(a2,3) ^ a3 
        s[i+2] = a0 ^ a1 ^ gmul(a2,2) ^ gmul(a3,3) 
        s[i+3] = gmul(a0,3) ^ a1 ^ a2 ^ gmul(a3,2) 
        s[i] &=255; s[i+1] &=255; s[i+2] &=255; s[i+3] &=255 

def inv_mix_columns(s): 
    for c in range(4): 
        i = 4*c 
        a0,a1,a2,a3 = s[i],s[i+1],s[i+2],s[i+3] 
        s[i]   = gmul(a0,14) ^ gmul(a1,11) ^ gmul(a2,13) ^ gmul(a3,9) 
        s[i+1] = gmul(a0,9)  ^ gmul(a1,14) ^ gmul(a2,11) ^ gmul(a3,13) 
        s[i+2] = gmul(a0,13) ^ gmul(a1,9)  ^ gmul(a2,14) ^ gmul(a3,11) 
        s[i+3] = gmul(a0,11) ^ gmul(a1,13) ^ gmul(a2,9)  ^ gmul(a3,14) 
        s[i] &=255; s[i+1] &=255; s[i+2] &=255; s[i+3] &=255 

def key_expand_128(key: bytes): 
    if len(key) != 16: 
        raise ValueError("AES-128 key must be 16 bytes.") 
    w = list(key) + [0]* (16*11 - 16) 
    for i in range(4, 44): 
        temp = w[4*(i-1):4*i] 
        if i % 4 == 0: 
            temp = temp[1:] + temp[:1] 
            temp = [SBOX[b] for b in temp] 
            temp[0] ^= RCON[i//4] 
        for j in range(4): 
            w[4*i + j] = w[4*(i-4) + j] ^ temp[j] 
    round_keys = [w[16*r:16*(r+1)] for r in range(11)] 
    return round_keys 

def aes_encrypt_block(block16: bytes, round_keys): 
    s = list(block16) 
    add_round_key(s, round_keys[0]) 
    for r in range(1, 10): 
        sub_bytes(s); shift_rows(s); mix_columns(s); add_round_key(s, round_keys[r]) 
    sub_bytes(s); shift_rows(s); add_round_key(s, round_keys[10]) 
    return bytes(s) 

def aes_decrypt_block(block16: bytes, round_keys): 
    s = list(block16) 
    add_round_key(s, round_keys[10]) 
    for r in range(9, 0, -1): 
        inv_shift_rows(s); inv_sub_bytes(s); add_round_key(s, round_keys[r]); inv_mix_columns(s) 
    inv_shift_rows(s); inv_sub_bytes(s); add_round_key(s, round_keys[0]) 
    return bytes(s) 

def xor16(a: bytes, b: bytes) -> bytes: 
    return bytes(x^y for x,y in zip(a,b)) 

def aes_cbc_encrypt(plaintext: bytes, key: bytes, iv: bytes) -> bytes: 
    if len(iv) != 16: 
        raise ValueError("IV must be 16 bytes.") 
    rk = key_expand_128(key) 
    pt = pkcs7_pad(plaintext, 16) 
    out = [] 
    prev = iv 
    for i in range(0, len(pt), 16): 
        blk = xor16(pt[i:i+16], prev) 
        ct = aes_encrypt_block(blk, rk) 
        out.append(ct) 
        prev = ct 
    return b"".join(out) 

def aes_cbc_decrypt(ciphertext: bytes, key: bytes, iv: bytes) -> bytes: 
    if len(ciphertext) % 16 != 0: 
        raise ValueError("Ciphertext must be multiple of 16 bytes.") 
    if len(iv) != 16: 
        raise ValueError("IV must be 16 bytes.") 
    rk = key_expand_128(key) 
    out = [] 
    prev = iv 
    for i in range(0, len(ciphertext), 16): 
        ct = ciphertext[i:i+16] 
        dec = aes_decrypt_block(ct, rk) 
        out.append(xor16(dec, prev)) 
        prev = ct 
    return pkcs7_unpad(b"".join(out), 16) 

def main(): 
    plaintext = input("Enter Plaintext: ") 
    key_hex  = input("Enter Key: ").strip() 
    iv_hex   = input("Enter IV: ").strip() 

    key = hex_to_bytes(key_hex) 
    iv  = hex_to_bytes(iv_hex) 

    ct = aes_cbc_encrypt(plaintext.encode("utf-8"), key, iv) 
    dec = aes_cbc_decrypt(ct, key, iv).decode("utf-8") 

    print("\nCiphertext (hex):", bytes_to_hex(ct)) 
    print("Decrypted Plaintext:", dec) 
    print("Status:", "Decryption Successful" if dec == plaintext else "Decryption Failed") 

if __name__ == "__main__": 
    main()



// MD5

import math 
import struct 

message = input("Enter the message (M): ") 
secret_key = input("Enter the secret key (K): ") 

A0 = 0x67452301 
B0 = 0xEFCDAB89 
C0 = 0x98BADCFE 
D0 = 0x10325476 

def left_rotate(x, c): 
    x &= 0xFFFFFFFF 
    return ((x << c) | (x >> (32 - c))) & 0xFFFFFFFF 

def to_ascii_hex(s): 
    return ''.join(f"{ord(ch):02X}" for ch in s) 

def to_binary_string(data_bytes): 
    return ''.join(f"{byte:08b}" for byte in data_bytes) 

def F(x, y, z): 
    return (x & y) | (~x & z) 

def G(x, y, z): 
    return (x & z) | (y & ~z) 

def H(x, y, z): 
    return x ^ y ^ z 

def I(x, y, z): 
    return y ^ (x | ~z) 

msg_hex = to_ascii_hex(message) 
key_hex = to_ascii_hex(secret_key) 

print("Message (M):", message) 
print("ASCII Hex of Message:", msg_hex) 

print("\nSecret Key (K):", secret_key) 
print("ASCII Hex of Secret Key:", key_hex) 

input_string = secret_key + message 
input_bytes = input_string.encode('ascii') 

print("\nConcatenated Input (K || M):", input_string) 
print("ASCII Hex of K || M:", to_ascii_hex(input_string)) 

original_bit_length = len(input_bytes) * 8 
print("\nOriginal length in bits:", original_bit_length) 

padded = bytearray(input_bytes) 
padded.append(0x80) 

while (len(padded) * 8) % 512 != 448: 
    padded.append(0) 

padded += struct.pack('<Q', original_bit_length) 

print("\nPadded message length in bits:", len(padded) * 8) 
print("Number of 512-bit blocks:", len(padded) // 64) 

print("\nPadded message in binary:") 
print(to_binary_string(padded)) 

blocks = [padded[i:i+64] for i in range(0, len(padded), 64)] 

for block_index, block in enumerate(blocks): 
    print(f"\n--- Block {block_index + 1} ---") 
    words = [struct.unpack('<I', block[i:i+4])[0] for i in range(0, 64, 4)] 
    for j, w in enumerate(words): 
        print(f"Word M[{j:2d}] = {w:08X}") 

s = [ 
7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 
5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 
4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 
6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21 
] 

K = [int(abs(math.sin(i + 1)) * (2**32)) & 0xFFFFFFFF for i in range(64)] 

A, B, C, D = A0, B0, C0, D0 

for block_index, block in enumerate(blocks): 
    M = [struct.unpack('<I', block[i:i+4])[0] for i in range(0, 64, 4)] 

    a, b, c, d = A, B, C, D 

    print(f"\n================ BLOCK {block_index + 1} PROCESSING ================") 
    print(f"Initial values:") 
    print(f"a = {a:08X}") 
    print(f"b = {b:08X}") 
    print(f"c = {c:08X}") 
    print(f"d = {d:08X}") 

    for i in range(64): 
        if 0 <= i <= 15: 
            f = F(b, c, d) 
            g = i 
            round_name = "Round 1" 
        elif 16 <= i <= 31: 
            f = G(b, c, d) 
            g = (5 * i + 1) % 16 
            round_name = "Round 2" 
        elif 32 <= i <= 47: 
            f = H(b, c, d) 
            g = (3 * i + 5) % 16 
            round_name = "Round 3" 
        else: 
            f = I(b, c, d) 
            g = (7 * i) % 16 
            round_name = "Round 4" 

        temp = d 
        d = c 
        c = b 

        x = (a + f + K[i] + M[g]) & 0xFFFFFFFF 
        b = (b + left_rotate(x, s[i])) & 0xFFFFFFFF 
        a = temp 

        print(f"{round_name} | Step {i+1:02d} | g={g:2d} | a={a:08X} b={b:08X} c={c:08X} d={d:08X}") 

    A = (A + a) & 0xFFFFFFFF 
    B = (B + b) & 0xFFFFFFFF 
    C = (C + c) & 0xFFFFFFFF 
    D = (D + d) & 0xFFFFFFFF 

print(f"\nUpdated buffer values after Block {block_index + 1}:") 
print(f"A = {A:08X}") 
print(f"B = {B:08X}") 
print(f"C = {C:08X}") 
print(f"D = {D:08X}") 

digest = struct.pack('<IIII', A, B, C, D) 
md5_hex = ''.join(f'{byte:02x}' for byte in digest) 

print("\n================ FINAL RESULT ================") 
print(f"Final A = {A:08X}") 
print(f"Final B = {B:08X}") 
print(f"Final C = {C:08X}") 
print(f"Final D = {D:08X}") 
print("MD5 Digest:", md5_hex)


