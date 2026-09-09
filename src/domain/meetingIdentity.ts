export function meetingIdentity(packet: {
  locationId: string;
  calendarId: string;
  appointmentId: string;
}): string {
  return `${packet.locationId}/${packet.calendarId}/${packet.appointmentId}`;
}
