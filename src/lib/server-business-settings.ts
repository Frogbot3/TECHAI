import BusinessSettingsModel from "@/models/BusinessSettings";
import { INITIAL_BUSINESS_SETTINGS } from "./business-settings";
import type { BusinessSettings } from "./tax-types";
export async function getBusinessSettings(): Promise<BusinessSettings> {
  const record: any = await BusinessSettingsModel.findOne({
    key: "invoice",
  }).lean();
  return JSON.parse(
    JSON.stringify(record?.settings || INITIAL_BUSINESS_SETTINGS),
  );
}
