import mongoose, { Document, Types } from "mongoose";
export type Difficulty = 'easy' | 'medium' | 'difficult';
export type Location = {
    description: string;
    type: 'Point';
    coordinates: [number, number];
    address: string;
    day: number;
}
export type StartLocation = Omit<Location, 'day'>
export interface Tour extends Document{
    name: string;
    slug: string;
    duration: number;
    maxGroupSize: number;
    difficulty: Difficulty;
    ratingsAverage: number;
    ratingsQuantity: number;
    price: number;
    priceDiscount:  number;
    summary: string;
    description: string;
    imageCover: string;
    images?: string[];
    createdAt: Date;
    startDates: Date[];
    secretTour: boolean;
    startLocation: StartLocation;
    locations: Location[];
    guides: Types.ObjectId[];
}

