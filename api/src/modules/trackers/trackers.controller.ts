import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { RequestWithResolvedUser } from '../../user-context/request-user.types';
import {
  type CreateTrackerInput,
  type TrackerView,
  TrackersService,
} from './trackers.service';

@Controller('trackers')
export class TrackersController {
  constructor(private readonly trackersService: TrackersService) {}

  @Get()
  listTrackers(
    @Req() request: RequestWithResolvedUser,
  ): Promise<TrackerView[]> {
    return this.trackersService.listForUser(request.user.id);
  }

  @Post()
  createTracker(
    @Req() request: RequestWithResolvedUser,
    @Body() input: CreateTrackerInput,
  ): Promise<TrackerView> {
    return this.trackersService.createForUser(request.user.id, input);
  }
}
