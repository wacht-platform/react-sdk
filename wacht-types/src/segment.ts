export type SegmentType = "user" | "organization" | "workspace";

export interface Segment {
  id: string;
  created_at: string;
  updated_at: string;
  deployment_id: string;
  name: string;
  type: SegmentType;
}
