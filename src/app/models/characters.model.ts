import { UserProfile } from "./profiles.model";

export interface LegoCharacter {
  id?: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  picture: string;
  gender: Gender;
  city_id: string;
  city: City;
  project_id: string;
  project: Project;
  created_by: string;
  creator: UserProfile;
  created_at?: Date
}

export interface City {
  id: string;
  name: string;
  country: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  start_date: Date;
  end_date: Date;
  members?: { count: number }[];
  totalMembers?: number;
  males?: number;
  females?: number;
}

export type Gender = GenderEnum.MALE | GenderEnum.FEMALE;

export enum GenderEnum {
  MALE = 'male',
  FEMALE = 'female'
}