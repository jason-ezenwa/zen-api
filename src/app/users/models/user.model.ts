import { prop, getModelForClass, pre, Prop } from '@typegoose/typegoose';
import bcrypt from 'bcryptjs';

@pre<User>('save', async function(this: User, next: () => void) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
})

export class User {
  @prop({ required: true })
  public firstName!: string;

  @prop({ required: true })
  public lastName!: string;

  @prop({ required: true })
  public dateOfBirth!: Date;

  @prop({ required: true })
  public email!: string;

  @prop({ required: true })
  public password!: string;

  @prop({ required: true })
  public phoneNumber!: string;

  @prop({ required: true })
  public bvn!: string;

  @prop({ required: true })
  public address!: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

const UserModel = getModelForClass(User);
export default UserModel;
