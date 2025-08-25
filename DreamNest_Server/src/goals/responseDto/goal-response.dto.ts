import { PlanResponseDto } from 'src/plan/responseDto/plan-response.dto';


export class GoalResponseDto {
  id: number;
  title: string;
  description: string;
  help_text?: string | null;
  vision_board_filename?: string | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  


  plans?: PlanResponseDto[];
}
