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

  async seedNotifications(): Promise<void> {
    const users = await this.userModel.find().exec();
    // console.log('Users:', users.length);
    const posts = await this.postModel.find().exec();
    // console.log('Posts:', posts.length);
    const comments = await this.commentModel.find().exec();
    // console.log('Comments:', comments.length);
    const reacts = await this.reactModel.find().exec();
    // console.log('Reacts:', reacts.length);
    const messages = await this.messageModel.find().exec();
    // console.log('Messages:', messages.length);
    const conversations = await this.conversationModel.find().exec();
    // console.log('Conversations:', conversations.length);
    const connections = await this.connectionModel
      .find({
        status: { $in: [ConnectionStatus.Pending, ConnectionStatus.Following] },
      })
      .exec();
    // console.log('Connections:', connections.length);
    const usersMap = new Map(users.map((u) => [u._id.toString(), u]));
    const postsMap = new Map(posts.map((p) => [p._id.toString(), p]));
    const commentsMap = new Map(comments.map((c) => [c._id.toString(), c]));
    const conversationsMap = new Map(
      conversations.map((c) => [c._id.toString(), c]),
    );

    const notifications: Partial<NotificationDocument>[] = [];
    let reactCount = 0;
    let commentCount = 0;
    let messageCount = 0;
    let connectionCount = 0;

    // Process React notifications
    for (const react of reacts) {
      let receiver, content, rootItemId;

      if (react.post_type === 'Comment') {
        const comment = commentsMap.get(react.post_id.toString());
        if (!comment) {
          console.log(`Comment not found for react: ${react._id}`);
          continue;
        }
        receiver = comment.author_id;
        content = `reacted to your comment`;
        rootItemId = comment.post_id;
      } else {
        const post = postsMap.get(react.post_id.toString());
        if (!post) {
          console.log(`Post not found for react: ${react._id}`);
          continue;
        }
        receiver = post.author_id;
        content = `reacted to your post`;
        rootItemId = post._id;
      }

      if (react.user_id.toString() === receiver.toString()) continue;

      notifications.push({
        sender_id: react.user_id,
        receiver_id: receiver,
        item_id: react._id,
        root_item_id: rootItemId,
        reference_type: 'React',
        content,
        seen: faker.datatype.boolean(),
        sent_at: new Date(react.reacted_at),
      });
      reactCount++;
    }

    // Process Comment notifications
    for (const comment of comments) {
      const post = postsMap.get(comment.post_id.toString());
      if (!post) {
        const commented = commentsMap.get(comment.post_id.toString());
        if (!commented) {
          console.log(`Post not found for comment: ${comment._id}`);
          continue;
        }
        if (comment.author_id.toString() === commented.author_id.toString())
          continue;

        notifications.push({
          sender_id: comment.author_id,
          receiver_id: commented.author_id,
          item_id: comment._id,
          root_item_id: commented._id,
          reference_type: 'Comment',
          content: `commented on your comment`,
          seen: faker.datatype.boolean(),
          sent_at: comment.commented_at,
        });
        commentCount++;
        continue;
      }

      if (comment.author_id.toString() === post.author_id.toString()) continue;

      notifications.push({
        sender_id: comment.author_id,
        receiver_id: post.author_id,
        item_id: comment._id,
        root_item_id: post._id,
        reference_type: 'Comment',
        content: `commented on your post`,
        seen: faker.datatype.boolean(),
        sent_at: comment.commented_at,
      });
      commentCount++;
    }

    // Process Message notifications
    for (const message of messages) {
      const conversation = conversationsMap.get(
        message.conversation_id.toString(),
      );
      if (!conversation) continue;

      const sender = usersMap.get(message.sender_id.toString());
      if (!sender) continue;

      const receiverId = conversation.participants.find(
        (p) => p.toString() !== message.sender_id.toString(),
      );
      if (!receiverId || message.sender_id.toString() === receiverId.toString())
        continue;

      notifications.push({
        sender_id: message.sender_id,
        receiver_id: receiverId,
        item_id: message._id,
        root_item_id: conversation._id,
        reference_type: 'Message',
        content: `sent you a message`,
        seen: faker.datatype.boolean(),
        sent_at: message.sent_at,
      });
      messageCount++;
    }

    // Process UserConnection notifications
    for (const connection of connections) {
      if (
        connection.sending_party.toString() ===
        connection.receiving_party.toString()
      )
        continue;

      const content =
        connection.status === ConnectionStatus.Pending
          ? `sent you a connection request`
          : `followed you`;

      notifications.push({
        sender_id: connection.sending_party,
        receiver_id: connection.receiving_party,
        item_id: connection._id,
        root_item_id: connection._id,
        reference_type: 'UserConnection',
        content,
        seen: faker.datatype.boolean(),
        sent_at: new Date(connection.created_at),
      });
      connectionCount++;
    }

    await this.notificationModel.insertMany(notifications);
    console.log(`${reactCount} React notifications added.`);
    console.log(`${commentCount} Comment notifications added.`);
    console.log(`${messageCount} Message notifications added.`);
    console.log(`${connectionCount} UserConnection notifications added.`);
    console.log(
      `${notifications.length} total notifications seeded successfully!`,
    );
  }

  async clearNotifications(): Promise<void> {
    await this.notificationModel.deleteMany({});
    console.log('Notifications collection cleared.');
  }
}
