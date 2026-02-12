export interface Ticket {
  id: string;
  date: string;
  businessUnit: string;
  module: string;
  supportType: string;
  status: string;
  description: string;
  createdBy: string;
  resolutionRemarks?: string;
}
