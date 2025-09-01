export class PostResponseDto {
  id: number;
  content: string;
  user_id: number;
  createdAt: Date;
  updatedAt: Date;


  user?: { id: number; userName: string; profilePicture?: string | null };


}
