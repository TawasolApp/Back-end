import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * validates the format of a MongoDB ObjectId.
 * @param id - the ID to validate.
 * @param scope - the name of the ID field for error messaging.
 * @throws BadRequestException if the ID is not valid.
 */
export function validateId(id: string, scope: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException(`Invalid ${scope} ID format.`);
  }
}
