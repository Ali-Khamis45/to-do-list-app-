import bcrypt from 'bcryptjs';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export class PasswordHasher implements IPasswordHasher {
  private readonly saltRounds = 10;

  public async hash(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, this.saltRounds, (err, hash) => {
        if (err) reject(err);
        else resolve(hash);
      });
    });
  }

  public async compare(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hash, (err, same) => {
        if (err) reject(err);
        else resolve(same);
      });
    });
  }
}
