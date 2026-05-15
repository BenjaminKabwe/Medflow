import { SettingsQuickLinks } from "@/components/settings/quick-link-settings";
import { ServiceSettings } from "@/components/settings/services-settings";
import { PaymentMethodSettings } from "@/components/settings/payment-method-settings";
import { MedicalHistorySettings } from "@/components/settings/medical-history-settings";
import { Card } from "@/components/ui/card";
import { SearchParamsProps } from "@/types";

const SystemSettingPage = async (props: SearchParamsProps) => {
  const searchParams = await props.searchParams;
  const cat = (searchParams?.cat || "services") as string;

  return (
    <div className="p-6 flex flex-col lg:flex-row w-full min-h-screen gap-10">
      <div className="w-full lg:w-[70%] flex flex-col gap-4">
        <Card className="shadow-none rounded-xl">
          {cat === "services"        && <ServiceSettings />}
          {cat === "payment"         && <PaymentMethodSettings />}
          {cat === "medical-history" && <MedicalHistorySettings />}
        </Card>
      </div>
      <div className="w-full space-y-6">
        <SettingsQuickLinks />
      </div>
    </div>
  );
};

export default SystemSettingPage;
