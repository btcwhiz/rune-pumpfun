import moment from "moment";

export const getTimeDifference = (date: any) => {
  const now = moment();
  const diff = now.diff(moment(date));
  const duration = moment.duration(diff);

  if (duration.asMinutes() < 60) {
    return `${Math.floor(duration.asMinutes())}m ago`;
  } else if (duration.asHours() < 24) {
    return `${Math.floor(duration.asHours())}h ago`;
  } else {
    return `${Math.floor(duration.asDays())}d ago`;
  }
};