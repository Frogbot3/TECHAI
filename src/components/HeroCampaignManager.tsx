"use client";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

import { AdminImage, AdminModal } from "./admin/AdminUI";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Copy,
  Edit,
  Eye,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { HeroCampaign, Product } from "@/lib/types";

interface HeroCampaignManagerProps {
  products: Product[];
}

type CampaignDraft = Omit<
  HeroCampaign,
  | "id"
  | "product"
  | "impressions"
  | "clicks"
  | "productClicks"
  | "createdAt"
  | "updatedAt"
> & { id?: string };

const toInputDate = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const defaultDates = () => {
  const start = new Date();
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { startAt: toInputDate(start), endAt: toInputDate(end) };
};

const createDraft = (product?: Product): CampaignDraft => {
  const dates = defaultDates();
  return {
    name: "Special Drop",
    badge: "SPECIAL DROP",
    productId: product?.id || "",
    titleOverride: "",
    subtitle:
      product?.description ||
      "Limited-time pricing on a verified TECH AI favorite.",
    price: product?.price || 0,
    originalPrice: product?.originalPrice || product?.price || 0,
    discountPercent: product?.discountPercent || 0,
    offerText: "Buy 3, Get a Gift",
    ctaText: "Shop Now",
    imageOverride: "",
    backgroundStyle: "solid",
    backgroundValue: "#5b2f87",
    verified: false,
    priority: 0,
    displayOrder: 0,
    startAt: dates.startAt,
    endAt: dates.endAt,
    isActive: true,
  };
};

const toDraft = (campaign: HeroCampaign): CampaignDraft => ({
  id: campaign.id,
  name: campaign.name,
  badge: campaign.badge,
  productId: campaign.productId,
  titleOverride: campaign.titleOverride || "",
  subtitle: campaign.subtitle,
  price: campaign.price,
  originalPrice: campaign.originalPrice,
  discountPercent: campaign.discountPercent,
  offerText: campaign.offerText,
  ctaText: campaign.ctaText,
  imageOverride: campaign.imageOverride || "",
  backgroundStyle: campaign.backgroundStyle,
  backgroundValue: campaign.backgroundValue,
  verified: campaign.verified,
  priority: campaign.priority,
  displayOrder: campaign.displayOrder,
  startAt: toInputDate(campaign.startAt),
  endAt: toInputDate(campaign.endAt),
  isActive: campaign.isActive,
});

export default function HeroCampaignManager({
  products,
}: HeroCampaignManagerProps) {
  const { notify, confirm: confirmAction } = useAdminFeedback();
  const [campaigns, setCampaigns] = useState<HeroCampaign[]>([]);
  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [preview, setPreview] = useState<CampaignDraft | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const sortedCampaigns = useMemo(
    () =>
      [...campaigns].sort(
        (a, b) => b.priority - a.priority || a.displayOrder - b.displayOrder,
      ),
    [campaigns],
  );

  const loadCampaigns = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/hero-campaigns?includeInactive=1", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Unable to load campaigns.");
      setCampaigns(data.campaigns || []);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const validateDraft = (value: CampaignDraft) => {
    if (
      !value.name.trim() ||
      !value.badge.trim() ||
      !value.productId ||
      !value.subtitle.trim() ||
      !value.offerText.trim() ||
      !value.ctaText.trim()
    )
      return "Complete the required campaign fields.";
    if (
      !value.startAt ||
      !value.endAt ||
      new Date(value.endAt) <= new Date(value.startAt)
    )
      return "End date must be after the start date.";
    if (value.price < 0 || value.originalPrice < 0)
      return "Prices cannot be negative.";
    if (value.originalPrice < value.price)
      return "MRP cannot be lower than the selling price.";
    return "";
  };

  const saveDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const validationError = validateDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setIsSaving(true);
    const payload = {
      ...draft,
      startAt: new Date(draft.startAt).toISOString(),
      endAt: new Date(draft.endAt).toISOString(),
      discountPercent:
        draft.originalPrice > draft.price
          ? Math.round(
              ((draft.originalPrice - draft.price) / draft.originalPrice) * 100,
            )
          : 0,
    };
    try {
      const response = await fetch(
        draft.id ? `/api/hero-campaigns/${draft.id}` : "/api/hero-campaigns",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Unable to save campaign.");
      setDraft(null);
      await loadCampaigns();
    } catch (saveError) {
      setError((saveError as Error).message);
      notify((saveError as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const patchCampaign = async (
    campaign: HeroCampaign,
    updates: Partial<CampaignDraft>,
  ) => {
    try {
      const response = await fetch(`/api/hero-campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...toDraft(campaign),
          ...updates,
          startAt: campaign.startAt,
          endAt: campaign.endAt,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Unable to update campaign.");
      await loadCampaigns();
    } catch (patchError) {
      setError((patchError as Error).message);
    }
  };

  const handleDelete = async (campaign: HeroCampaign) => {
    if (
      !(await confirmAction(
        `Delete campaign "${campaign.name}"? This cannot be undone.`,
      ))
    )
      return;
    try {
      const response = await fetch(`/api/hero-campaigns/${campaign.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Unable to delete campaign.");
      await loadCampaigns();
    } catch (deleteError) {
      setError((deleteError as Error).message);
    }
  };

  const moveCampaign = async (campaign: HeroCampaign, direction: -1 | 1) => {
    const index = sortedCampaigns.findIndex((item) => item.id === campaign.id);
    const target = sortedCampaigns[index + direction];
    if (!target) return;
    await Promise.all([
      patchCampaign(campaign, { displayOrder: target.displayOrder }),
      patchCampaign(target, { displayOrder: campaign.displayOrder }),
    ]);
  };

  const selectedProduct = products.find(
    (product) => product.id === draft?.productId,
  );
  const previewProduct = products.find(
    (product) => product.id === preview?.productId,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-admin-text flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-admin-info" /> Campaign scheduling
            & hero analytics
          </h3>
          <p className="text-[11px] text-admin-muted mt-1">
            The storefront only rotates active campaigns whose server time falls
            between their start and end dates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError("");
            setDraft(createDraft(products[0]));
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-admin-primary hover:bg-admin-primary text-admin-on-primary rounded-xl text-xs font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-admin-border bg-admin-danger-bg px-3 py-2 text-xs font-medium text-admin-danger">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="rounded-xl border border-admin-border bg-admin-surface p-6 text-center text-xs text-admin-muted">
          Loading campaigns…
        </p>
      ) : error && campaigns.length === 0 ? (
        <div className="admin-empty">
          <p>Campaigns could not be loaded.</p>
          <button className="admin-button" onClick={loadCampaigns}>
            Retry campaigns
          </button>
        </div>
      ) : sortedCampaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-admin-border bg-admin-surface p-8 text-center">
          <p className="text-sm font-medium text-admin-text">
            No scheduled campaigns yet.
          </p>
          <p className="text-xs text-admin-muted mt-1">
            Legacy product hero promotions will continue as the safe storefront
            fallback.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-admin-border bg-admin-surface">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-admin-surface text-[10px]  text-admin-muted">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Impressions</th>
                <th className="px-4 py-3">Clicks / CTR</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {sortedCampaigns.map((campaign, index) => {
                const ctr = campaign.impressions
                  ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
                  : "0.00";
                const now = Date.now();
                const scheduled =
                  campaign.isActive &&
                  new Date(campaign.startAt).getTime() <= now &&
                  new Date(campaign.endAt).getTime() >= now;
                return (
                  <tr key={campaign.id} className="hover:bg-admin-surface">
                    <td className="px-4 py-3">
                      <p className="font-medium text-admin-text">
                        {campaign.name}
                      </p>
                      <p className="mt-0.5 max-w-[240px] truncate text-admin-muted">
                        {campaign.product?.title || campaign.productId}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-admin-muted">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-admin-info" />
                        {new Date(campaign.startAt).toLocaleDateString()} –{" "}
                        {new Date(campaign.endAt).toLocaleDateString()}
                      </div>
                      <p className="mt-1 text-[10px] text-admin-muted">
                        Priority {campaign.priority} · Order{" "}
                        {campaign.displayOrder}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-medium ${scheduled ? "border-admin-border bg-admin-success-bg text-admin-success" : campaign.isActive ? "border-admin-border bg-admin-warning-bg text-admin-warning" : "border-admin-border bg-admin-surface text-admin-muted"}`}
                      >
                        {scheduled
                          ? "Live"
                          : campaign.isActive
                            ? "Scheduled"
                            : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-admin-text">
                      {campaign.impressions.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-admin-info">
                        {campaign.clicks.toLocaleString("en-IN")} clicks
                      </p>
                      <p className="text-[10px] text-admin-muted">{ctr}% CTR</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreview(toDraft(campaign))}
                          title="Preview on mobile"
                          className="rounded-lg bg-admin-subtle p-2 text-admin-info hover:bg-admin-subtle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraft(toDraft(campaign))}
                          title="Edit campaign"
                          className="rounded-lg bg-admin-subtle p-2 text-admin-success hover:bg-admin-subtle"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...toDraft(campaign),
                              id: undefined,
                              name: `${campaign.name} Copy`,
                              isActive: false,
                            })
                          }
                          title="Duplicate campaign"
                          className="rounded-lg bg-admin-subtle p-2 text-admin-info hover:bg-admin-subtle"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            patchCampaign(campaign, {
                              isActive: !campaign.isActive,
                            })
                          }
                          title={
                            campaign.isActive
                              ? "Deactivate campaign"
                              : "Activate campaign"
                          }
                          className="rounded-lg bg-admin-subtle px-2 py-1.5 text-[10px] font-medium text-admin-warning hover:bg-admin-subtle"
                        >
                          {campaign.isActive ? "Pause" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCampaign(campaign, -1)}
                          disabled={index === 0}
                          title="Move up"
                          className="rounded-lg bg-admin-subtle p-2 text-admin-text hover:bg-admin-subtle disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCampaign(campaign, 1)}
                          disabled={index === sortedCampaigns.length - 1}
                          title="Move down"
                          className="rounded-lg bg-admin-subtle p-2 text-admin-text hover:bg-admin-subtle disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(campaign)}
                          title="Delete campaign"
                          className="rounded-lg bg-admin-subtle p-2 text-admin-danger hover:bg-admin-danger-bg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {draft && (
        <AdminModal label="Campaign editor" onClose={() => setDraft(null)}>
          <div className="my-auto flex max-h-[94vh] w-full max-w-5xl flex-col rounded-xl border border-admin-border bg-admin-surface p-5  sm:p-6">
            <div className="flex items-center justify-between border-b border-admin-border pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-base font-medium text-admin-text">
                  <Sparkles className="h-5 w-5 text-admin-info" />
                  {draft.id ? "Edit Campaign" : "Create Campaign"}
                </h3>
                <p className="mt-1 text-[11px] text-admin-muted">
                  All values are stored in MongoDB and schedule against server
                  time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                aria-label="Close campaign editor"
                className="rounded-full bg-admin-subtle p-2 text-admin-muted hover:text-admin-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              id="admin-campaign-form"
              onSubmit={saveDraft}
              className="grid min-h-0 flex-1 gap-5 overflow-y-auto py-4 lg:grid-cols-[1fr_300px]"
            >
              <div className="space-y-4 text-xs">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Campaign name *
                    </span>
                    <input
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                      required
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Campaign badge *
                    </span>
                    <input
                      value={draft.badge}
                      onChange={(e) =>
                        setDraft({ ...draft, badge: e.target.value })
                      }
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                      required
                    />
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="font-medium text-admin-text">Product *</span>
                  <select
                    value={draft.productId}
                    onChange={(e) => {
                      const product = products.find(
                        (item) => item.id === e.target.value,
                      );
                      setDraft({
                        ...draft,
                        productId: e.target.value,
                        subtitle: product?.description || "",
                        price: product?.price || draft.price,
                        originalPrice:
                          product?.originalPrice || draft.originalPrice,
                        imageOverride: "",
                      });
                    }}
                    className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 font-medium text-admin-text"
                    required
                  >
                    <option value="">Choose a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Title override
                    </span>
                    <input
                      value={draft.titleOverride}
                      onChange={(e) =>
                        setDraft({ ...draft, titleOverride: e.target.value })
                      }
                      placeholder={selectedProduct?.title}
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      CTA text *
                    </span>
                    <input
                      value={draft.ctaText}
                      onChange={(e) =>
                        setDraft({ ...draft, ctaText: e.target.value })
                      }
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                      required
                    />
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="font-medium text-admin-text">
                    Product description (from catalog)
                  </span>
                  <textarea
                    value={selectedProduct?.description || ""}
                    readOnly
                    rows={3}
                    className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                    required
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Catalog selling price
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={selectedProduct?.price || 0}
                      readOnly
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                      required
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Catalog MRP
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={selectedProduct?.originalPrice || 0}
                      readOnly
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                      required
                    />
                  </label>
                  <div className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2">
                    <span className="font-medium text-admin-muted">
                      Discount
                    </span>
                    <p className="mt-1 text-base font-medium text-admin-success">
                      {draft.originalPrice > draft.price
                        ? Math.round(
                            ((draft.originalPrice - draft.price) /
                              draft.originalPrice) *
                              100,
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Offer text *
                    </span>
                    <input
                      value={draft.offerText}
                      onChange={(e) =>
                        setDraft({ ...draft, offerText: e.target.value })
                      }
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                      required
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Image override URL
                    </span>
                    <input
                      value={draft.imageOverride}
                      onChange={(e) =>
                        setDraft({ ...draft, imageOverride: e.target.value })
                      }
                      placeholder="Uses product image when empty"
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Starts *
                    </span>
                    <input
                      type="datetime-local"
                      value={draft.startAt}
                      onChange={(e) =>
                        setDraft({ ...draft, startAt: e.target.value })
                      }
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                      required
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">Ends *</span>
                    <input
                      type="datetime-local"
                      value={draft.endAt}
                      onChange={(e) =>
                        setDraft({ ...draft, endAt: e.target.value })
                      }
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                      required
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Priority
                    </span>
                    <input
                      type="number"
                      value={draft.priority}
                      onChange={(e) =>
                        setDraft({ ...draft, priority: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Display order
                    </span>
                    <input
                      type="number"
                      value={draft.displayOrder}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          displayOrder: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Background
                    </span>
                    <select
                      value={draft.backgroundStyle}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          backgroundStyle: e.target
                            .value as HeroCampaign["backgroundStyle"],
                        })
                      }
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                    >
                      <option value="solid">Solid</option>
                      <option value="gradient">CSS gradient</option>
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="font-medium text-admin-text">
                      Color / gradient
                    </span>
                    <input
                      value={draft.backgroundValue}
                      onChange={(e) =>
                        setDraft({ ...draft, backgroundValue: e.target.value })
                      }
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-admin-text"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-5 rounded-xl border border-admin-border bg-admin-surface p-3">
                  <label className="flex items-center gap-2 font-medium text-admin-text">
                    <input
                      type="checkbox"
                      checked={draft.verified}
                      onChange={(e) =>
                        setDraft({ ...draft, verified: e.target.checked })
                      }
                      className="h-4 w-4"
                    />{" "}
                    Show Verified badge
                  </label>
                  <label className="flex items-center gap-2 font-medium text-admin-text">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(e) =>
                        setDraft({ ...draft, isActive: e.target.checked })
                      }
                      className="h-4 w-4"
                    />{" "}
                    Active
                  </label>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-admin-muted">
                  Campaign preview
                </p>
                <PreviewCard campaign={draft} product={selectedProduct} />
              </div>
            </form>
            <div className="admin-form-footer flex-wrap">
              <button
                type="button"
                onClick={() => setPreview(draft)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-admin-border bg-admin-info-bg px-3.5 py-2.5 font-medium text-admin-info"
              >
                <Eye className="h-4 w-4" /> Preview on Mobile
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                aria-label="Close campaign editor"
                className="px-4 py-2.5 font-medium text-admin-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="admin-campaign-form"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-admin-primary px-4 py-2.5 font-medium text-admin-on-primary disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving…" : "Save Campaign"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {preview && (
        <AdminModal
          label="Mobile campaign preview"
          onClose={() => setPreview(null)}
        >
          <div className="w-full max-w-sm rounded-xl border border-admin-border bg-admin-surface p-4 ">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-admin-info">
                  Preview on Mobile
                </p>
                <p className="mt-1 text-xs text-admin-muted">
                  Approx. 390px storefront width
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="rounded-full bg-admin-subtle p-2 text-admin-muted hover:text-admin-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <PreviewCard campaign={preview} product={previewProduct} />
          </div>
        </AdminModal>
      )}
    </div>
  );
}

function PreviewCard({
  campaign,
  product,
}: {
  campaign: CampaignDraft;
  product?: Product;
}) {
  const backgroundStyle =
    campaign.backgroundStyle === "gradient"
      ? { backgroundImage: campaign.backgroundValue }
      : { backgroundColor: campaign.backgroundValue };
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/20 p-3 text-white shadow-xl"
      style={backgroundStyle}
    >
      <div className="grid grid-cols-[1.1fr_0.9fr] items-center gap-2">
        <div className="min-w-0 space-y-2">
          <span className="inline-flex max-w-full truncate rounded-md border border-white/25 bg-white/15 px-2 py-1 text-[9px] font-black uppercase tracking-wider">
            {campaign.badge}
          </span>
          <h4 className="line-clamp-2 text-[13px] font-black leading-tight">
            {campaign.titleOverride || product?.title || "Select a product"}
          </h4>
          <div className="flex min-w-0 flex-wrap items-baseline gap-1">
            <strong className="text-base font-black">
              ₹{campaign.price.toLocaleString("en-IN")}
            </strong>
            {campaign.originalPrice > campaign.price && (
              <del className="text-[9px] text-white/60">
                ₹{campaign.originalPrice.toLocaleString("en-IN")}
              </del>
            )}
          </div>
          <span
            className="inline-flex max-w-full truncate rounded-md bg-rose-600 px-1.5 py-1 text-[8px] font-black"
            title={campaign.offerText}
          >
            {campaign.offerText}
          </span>
          <button
            type="button"
            className="inline-flex min-h-9 items-center rounded-lg bg-white px-3 text-[10px] font-black text-slate-900"
          >
            {campaign.ctaText} →
          </button>
        </div>
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/25 bg-black/20 p-2">
          {product && (
            <AdminImage
              src={campaign.imageOverride || product.image}
              alt={campaign.titleOverride || product.title}
              className="h-full w-full rounded-lg object-contain"
            />
          )}
          {campaign.verified && (
            <span className="absolute right-1 top-1 rounded bg-emerald-950/90 px-1 py-0.5 text-[8px] font-bold text-emerald-300">
              Verified
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 border-t border-white/20 pt-2">
        <span className="inline-block h-1.5 w-6 rounded-full bg-white" />
        <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white/40" />
        <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white/40" />
      </div>
    </div>
  );
}
