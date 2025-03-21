import { Injectable } from '@nestjs/common';
import { Test, TestDocument } from './database/test.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Test.name)
    private readonly testModel: Model<TestDocument>,
  ) {}
  async getTest() {
    return 'Get request tested successfully.';
  }

  async postTest(testMessage: string) {
    const testDocument = new this.testModel({
      _id: new Types.ObjectId(),
      message: testMessage,
    });
    await testDocument.save();
    return 'Post request tested successfully.'
  }
}
