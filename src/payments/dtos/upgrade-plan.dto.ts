import {
  IsNotEmpty,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { PlanType } from '../enums/plan-type.enum';

export class UpgradePlanDto {
  @IsEnum(PlanType)
  @IsNotEmpty()
  readonly planType: PlanType;

  @IsBoolean()
  @IsNotEmpty()
  readonly autoRenewal: boolean;
}
