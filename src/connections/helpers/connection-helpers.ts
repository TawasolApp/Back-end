import { Model, Types } from 'mongoose';
import { UserConnectionDocument } from '../infrastructure/database/schemas/user-connection.schema';
import { ConnectionStatus } from '../enums/connection-status.enum';

export async function getConnection(
  userConnectionModel: Model<UserConnectionDocument>,
  sendingParty: string,
  receivingParty: string,
) {
  const connectionRecord = await userConnectionModel
    .findOne({
      sending_party: new Types.ObjectId(sendingParty),
      receiving_party: new Types.ObjectId(receivingParty),
      status: ConnectionStatus.Connected,
    })
    .lean();
  return connectionRecord || null;
}

export async function getFollow(
  userConnectionModel: Model<UserConnectionDocument>,
  sendingParty: string,
  receivingParty: string,
) {
  const followRecord = await userConnectionModel
    .findOne({
      sending_party: new Types.ObjectId(sendingParty),
      receiving_party: new Types.ObjectId(receivingParty),
      status: ConnectionStatus.Following,
    })
    .lean();
  return followRecord || null;
}

export async function getPending(
  userConnectionModel: Model<UserConnectionDocument>,
  sendingParty: string,
  receivingParty: string,
) {
  const pendingRecord = await userConnectionModel
    .findOne({
      sending_party: new Types.ObjectId(sendingParty),
      receiving_party: new Types.ObjectId(receivingParty),
      status: ConnectionStatus.Pending,
    })
    .lean();
  return pendingRecord || null;
}
