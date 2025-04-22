import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import {
  React,
  ReactDocument,
} from '../../../../posts/infrastructure/database/schemas/react.schema';
import {
  Comment,
  CommentDocument,
} from '../../../../posts/infrastructure/database/schemas/comment.schema';
import {
  Post,
  PostDocument,
} from '../../../../posts/infrastructure/database/schemas/post.schema';
import {
  Message,
  MessageDocument,
} from '../../../../messages/infrastructure/database/schemas/message.schema';
import {
  Conversation,
  ConversationDocument,
} from '../../../../messages/infrastructure/database/schemas/conversation.schema';
import {
  UserConnection,
  UserConnectionDocument,
} from '../../../../connections/infrastructure/database/schemas/user-connection.schema';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/schemas/user.schema';
import { ConnectionStatus } from '../../../../connections/enums/connection-status.enum';

@Injectable()
export class NotificationSeeder {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(React.name) private reactModel: Model<ReactDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(UserConnection.name)
    private connectionModel: Model<UserConnectionDocument>,
  ) {}

  async seedNotifications(count: number): Promise<void> {
    const users = await this.userModel
      .find()
      .select('_id first_name last_name')
      .lean();
    const posts = await this.postModel.find().select('_id author_id').lean();
    const comments = await this.commentModel
      .find()
      .select('_id post_id author_id commented_at')
      .lean();
    const reacts = await this.reactModel
      .find()
      .select('_id user_id post_type post_id reacted_at')
      .lean();
    const messages = await this.messageModel
      .find()
      .select('_id sender_id conversation_id sent_at')
      .lean();
    const conversations = await this.conversationModel
      .find()
      .select('_id participants')
      .lean();
    const connections = await this.connectionModel
      .find({
        status: { $in: [ConnectionStatus.Pending, ConnectionStatus.Following] },
      })
      .select('_id sending_party receiving_party status created_at')
      .lean();

    const usersMap = new Map(users.map((u) => [u._id.toString(), u]));
    const postsMap = new Map(posts.map((p) => [p._id.toString(), p]));
    const commentsMap = new Map(comments.map((c) => [c._id.toString(), c]));
    const conversationsMap = new Map(
      conversations.map((c) => [c._id.toString(), c]),
    );

    const notifications: Partial<NotificationDocument>[] = [];
    const types = ['React', 'Comment', 'Message', 'UserConnection'] as const;

    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement(types);
      let referenceId, sentAt, receiver, content, senderId;

      switch (type) {
        case 'React': {
          const react = faker.helpers.arrayElement(reacts);
          if (!react) continue;

          referenceId = react._id;
          sentAt = new Date(react.reacted_at);
          const sender = usersMap.get(react.user_id.toString());
          if (!sender) continue;

          const senderName = `${sender.first_name} ${sender.last_name}`;

          if (react.post_type === 'Comment') {
            const comment = commentsMap.get(react.post_id.toString());
            if (!comment) continue;
            receiver = comment.author_id;
            content = `reacted to your comment`;
            senderId = react.user_id;
          } else {
            const post = postsMap.get(react.post_id.toString());
            if (!post) continue;
            receiver = post.author_id;
            content = `reacted to your post`;
            senderId = react.user_id;
          }
          break;
        }

        case 'Comment': {
          const comment = faker.helpers.arrayElement(comments);
          if (!comment) continue;

          referenceId = comment._id;
          sentAt = comment.commented_at;
          const commenter = usersMap.get(comment.author_id.toString());
          if (!commenter) continue;

          const commenterName = `${commenter.first_name} ${commenter.last_name}`;

          const post = postsMap.get(comment.post_id.toString());
          if (!post) continue;

          receiver = post.author_id;
          senderId = comment.author_id;
          content = `commented on your post`;
          break;
        }

        case 'Message': {
          const message = faker.helpers.arrayElement(messages);
          if (!message) continue;

          const conversation = conversationsMap.get(
            message.conversation_id.toString(),
          );
          if (!conversation) continue;

          referenceId = message._id;
          sentAt = message.sent_at;

          const sender = usersMap.get(message.sender_id.toString());
          if (!sender) continue;

          const senderName = `${sender.first_name} ${sender.last_name}`;

          const receiverId = conversation.participants.find(
            (p) => p.toString() !== message.sender_id.toString(),
          );
          if (!receiverId) continue;

          receiver = receiverId;
          senderId = message.sender_id;
          content = `sent you a message`;
          break;
        }

        case 'UserConnection': {
          const connection = faker.helpers.arrayElement(connections);
          if (!connection) continue;

          referenceId = connection._id;
          sentAt = new Date(connection.created_at);

          const sender = usersMap.get(connection.sending_party.toString());
          if (!sender) continue;

          const senderName = `${sender.first_name} ${sender.last_name}`;
          receiver = connection.receiving_party;
          senderId = connection.sending_party;

          content =
            connection.status === ConnectionStatus.Pending
              ? `sent you a connection request`
              : `followed you`;
          break;
        }
      }

      if (!receiver || !referenceId) continue;

      notifications.push({
        sender_id: senderId,
        receiver_id: receiver,
        item_id: referenceId,
        reference_type: type,
        content,
        seen: faker.datatype.boolean(),
        sent_at: sentAt,
      });
    }

    await this.notificationModel.insertMany(notifications);
    console.log(`${notifications.length} notifications seeded successfully!`);
  }

  async clearNotifications(): Promise<void> {
    await this.notificationModel.deleteMany({});
    console.log('Notifications collection cleared.');
  }
}
