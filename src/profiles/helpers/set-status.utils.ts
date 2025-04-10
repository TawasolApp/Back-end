import {
  getConnection,
  getFollow,
  getIgnored,
  getPending,
} from '../../connections/helpers/connection-helpers';
import { ProfileStatus } from '../enums/profile-enums';

export async function setConnectionStatus(
  model: any,
  loggedInUser: string,
  otherUser: string,
) {
  if (loggedInUser == otherUser) {
    return ProfileStatus.ME;
  } else if (
    (await getConnection(model, otherUser, loggedInUser)) ||
    (await getConnection(model, loggedInUser, otherUser))
  ) {
    return ProfileStatus.CONNECTION;
  } else if (
    (await getPending(model, loggedInUser, otherUser)) ||
    (await getIgnored(model, loggedInUser, otherUser))
  ) {
    return ProfileStatus.PENDING;
  } else if (
    await getPending(model, otherUser, loggedInUser)
  ) {
    return ProfileStatus.REQUEST;
  } else {
    return ProfileStatus.NULL;
  }
}

export async function setFollowStatus(
  model: any,
  loggedInUser: string,
  otherUser: string,
) {
  if (loggedInUser == otherUser) {
    return ProfileStatus.ME;
  } else if (
    await getFollow(model, loggedInUser, otherUser)
  ) {
    return ProfileStatus.FOLLOWING;
  } else {
    return ProfileStatus.NULL;
  }
}
