import { PlanResponseDto } from 'src/plan/responseDto/plan-response.dto';


export class GoalResponseDto {
  id: number;
  title: string;
  description: string;
  helpText?: string | null;
  visionBoardFilename?: string | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  


  plans?: PlanResponseDto[];
}
