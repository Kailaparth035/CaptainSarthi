import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Toast, { ToastType } from "../components/Toast";
import { SCREEN_NAMES } from "../constants/screenNames";
import type { FarmerStackParamList } from "../navigation/stacks/FarmerStack";
import { getData } from "../Service/Apimethod";
import Apis from "../Service/constant";
import { getImageUrl } from "../utils/imageUtils";
import colors from "../utils/colors";
import useDeviceMetrics from "../utils/responsiveCustom";
import { Typography } from "../utils/typography";
import { useDynamicStatusBar } from "../hooks/useDynamicStatusBar";

type CertificateRoute = RouteProp<
  FarmerStackParamList,
  typeof SCREEN_NAMES.SaathiMembershipCertificate
>;
type CertificateNavigation = NativeStackNavigationProp<FarmerStackParamList>;
type LocationNames = {
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
};
type CertificateCategory = {
  id: string;
  name: string;
};
type CertificatePdfModule = {
  save: (html: string, fileName: string) => Promise<string>;
  getBrandAssets: () => Promise<BrandAssets>;
  openCertificate: (uri: string) => Promise<void>;
  shareCertificate: (uri: string) => Promise<void>;
};
type BrandAssets = {
  captainLogoUri: string;
  saathiLogoUri: string;
};

const certificatePdf = NativeModules.CertificatePdf as
  | CertificatePdfModule
  | undefined;

const androidBrandAssetFallback: BrandAssets = {
  // These bundled URIs work in a debug/Metro build as well as a release APK.
  // Native base64 assets replace them when available, but a missing generated
  // Android drawable must never make the certificate look blank.
  captainLogoUri: Image.resolveAssetSource(
    require("../assets/images/captainTractorLogo.png")
  ).uri,
  saathiLogoUri: Image.resolveAssetSource(
    require("../assets/images/Mainlogo_english.png")
  ).uri,
};

// Certificate data is already supplied by the farmer-details screen.  These
// requests only enrich labels and logos, so they must never hold the preview
// hostage when a device is offline or a service is slow.
const OPTIONAL_LOOKUP_TIMEOUT_MS = 6000;
const PREVIEW_LOAD_TIMEOUT_MS = 8000;
const PREVIEW_BRAND_WAIT_MS = 2000;
const PREVIEW_CATEGORY_WAIT_MS = 2000;

const resolveWithin = <T,>(
  request: Promise<T>,
  timeoutMs = OPTIONAL_LOOKUP_TIMEOUT_MS
): Promise<T | undefined> =>
  new Promise((resolve) => {
    let settled = false;
    const finish = (value: T | undefined) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve(value);
    };
    const timeout = setTimeout(() => finish(undefined), timeoutMs);

    Promise.resolve(request)
      .then((value) => finish(value))
      .catch(() => finish(undefined));
  });

const firstValue = (...values: unknown[]): unknown =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const textValue = (...values: unknown[]): string => {
  const value = firstValue(...values);
  if (typeof value === "object" || value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const nameFromLocationValue = (value: unknown): string => {
  if (value && typeof value === "object") {
    return textValue(
      (value as any).name,
      (value as any).label,
      (value as any).state_name,
      (value as any).district_name,
      (value as any).taluka_name,
      (value as any).village_name
    );
  }

  const valueText = textValue(value);
  return /^\d+$/.test(valueText) ? "" : valueText;
};

const idFromLocationValue = (value: unknown): string => {
  if (value && typeof value === "object") {
    return textValue((value as any).id, (value as any).value);
  }

  return textValue(value);
};

const dateFromValue = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  const valueText = textValue(value);
  if (!valueText) {
    return null;
  }

  // Date-only API values must be created in local time. Parsing YYYY-MM-DD
  // directly as UTC can display the previous calendar day on some devices.
  const yearFirst = valueText.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (yearFirst) {
    return new Date(
      Number(yearFirst[1]),
      Number(yearFirst[2]) - 1,
      Number(yearFirst[3])
    );
  }

  const dayFirst = valueText.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dayFirst) {
    return new Date(
      Number(dayFirst[3]),
      Number(dayFirst[2]) - 1,
      Number(dayFirst[1])
    );
  }

  const date = new Date(valueText);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formatDate = (value: unknown): string => {
  const valueText = textValue(value);
  const date = dateFromValue(value);
  if (!date) {
    return valueText;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const validUntil = (value: unknown): string => {
  const date = dateFromValue(value);
  if (!date) {
    return "";
  }

  date.setFullYear(date.getFullYear() + 3);
  return formatDate(date);
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const certificateValue = (value: string) =>
  value ? escapeHtml(value) : "&nbsp;";

const selectionCriteria = [
  {
    code: "A",
    text: "Customers who own more than one Captain Tractor.",
    keywords: ["more than one", "own more", "multiple tractor"],
  },
  {
    code: "B",
    text: "Customers who have purchased different generations of Captain Tractors and consistently upgraded with our products.",
    keywords: ["different generation", "upgraded", "upgrade"],
  },
  {
    code: "C",
    text: "Long-time customers (associated for over 15 years) who still actively use Captain Tractors.",
    keywords: ["long-time", "long time", "15 years", "fifteen years"],
  },
  {
    code: "D",
    text: "Customers who use Captain Tractors and have influenced the sale of more than 10 tractors in their village.",
    keywords: ["influenced", "more than 10", "sale of"],
  },
  {
    code: "E",
    text: "Customers who have earned significant income through rental services using Captain Tractors.",
    keywords: ["rental", "significant income", "rental service"],
  },
  {
    code: "F",
    text: "Customers who have developed or innovated any machine that is operated using a Captain Tractor.",
    keywords: ["developed", "innovated", "innovative", "machine"],
  },
  {
    code: "G",
    text: "Customers who use Captain Tractors for any kind of social or community service activities.",
    keywords: ["social", "community service", "community"],
  },
] as const;

const categoryNameFrom = (value: unknown): string => {
  if (value && typeof value === "object") {
    return textValue(
      (value as any).name,
      (value as any).label,
      (value as any).category_name,
      (value as any).categoryName,
      (value as any).title
    );
  }

  const name = textValue(value);
  return /^\d+$/.test(name) ? "" : name;
};

const categoryIdFrom = (value: unknown): string => {
  if (value && typeof value === "object") {
    return textValue(
      (value as any).id,
      (value as any).category_id,
      (value as any).categoryId,
      (value as any).value
    );
  }

  return textValue(value);
};

const selectedCriterionCode = (categoryName: string) => {
  const normalizedName = categoryName.toLocaleLowerCase();
  const namedCriterion = selectionCriteria.find(
    (criterion) =>
      new RegExp(
        `(?:^|\\b)(?:category\\s*)?${criterion.code}(?:\\b|$)`,
        "i"
      ).test(categoryName) ||
      criterion.keywords.some((keyword) => normalizedName.includes(keyword))
  );

  if (namedCriterion) {
    return namedCriterion.code;
  }

  // Database category IDs are not guaranteed to be A-G positions. For
  // example, category ID 6 can be the dealer's second displayed category.
  // Only use an explicit ordinal in the category *name*, never the database
  // ID, so a farmer's selection cannot be marked against another criterion.
  const ordinal = categoryName.match(
    /(?:category|criteria|criterion)\s*(?:no\.?|number)?\s*([1-7])\b/i
  );
  if (ordinal) {
    return selectionCriteria[Number(ordinal[1]) - 1].code;
  }

  const standaloneOrdinal = categoryName.match(/^\s*([1-7])\s*$/);
  return standaloneOrdinal
    ? selectionCriteria[Number(standaloneOrdinal[1]) - 1].code
    : "";
};

// The official certificate template has one compact Location cell. Showing
// the dealer's complete postal address makes that row much taller than the
// template, so the certificate intentionally displays the dealer district.
const districtFromDealer = (dealer: any): string => {
  const address = dealer?.address;
  const addressObject =
    address && typeof address === "object" && !Array.isArray(address)
      ? address
      : {};

  const district = nameFromLocationValue(
    firstValue(
      addressObject?.district_data,
      dealer?.district_data,
      addressObject?.district_name,
      dealer?.district_name,
      addressObject?.district,
      dealer?.district
    )
  );

  // A numeric identifier is not meaningful on the certificate. Leave the
  // cell blank when the dealer response does not include a district name.
  return /^\d+$/.test(district) ? "" : district;
};

const imageUrlFrom = (...values: unknown[]): string => {
  const imageValue = firstValue(...values);
  const imagePath =
    imageValue && typeof imageValue === "object"
      ? textValue(
          (imageValue as any).url,
          (imageValue as any).uri,
          (imageValue as any).path,
          (imageValue as any).image_url,
          (imageValue as any).profile_image,
          (imageValue as any).profile_photo_url
        )
      : textValue(imageValue);

  if (
    imagePath.startsWith("data:") ||
    imagePath.startsWith("file://") ||
    imagePath.startsWith("content://")
  ) {
    return imagePath;
  }

  return getImageUrl(imagePath) || "";
};

const buildCertificateHtml = ({
  captainLogoUri,
  saathiLogoUri,
  farmerPhotoUri,
  membershipNo,
  memberName,
  village,
  taluka,
  district,
  state,
  mobile,
  whatsapp,
  dealershipName,
  location,
  dealerName,
  dealerCode,
  membershipDate,
  validTill,
  signatureDate,
  selectedCriterion,
}: {
  captainLogoUri: string;
  saathiLogoUri: string;
  farmerPhotoUri: string;
  membershipNo: string;
  memberName: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  mobile: string;
  whatsapp: string;
  dealershipName: string;
  location: string;
  dealerName: string;
  dealerCode: string;
  membershipDate: string;
  validTill: string;
  signatureDate: string;
  selectedCriterion: string;
}) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=0.42, maximum-scale=3, user-scalable=yes" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #efefef; }
    body { color: #000; font-family: Arial, Helvetica, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto 6mm; background: #fff; }
    .page-one { padding: 8mm 17mm 12mm; page-break-after: always; break-after: page; position: relative; }
    .page-two { padding: 8mm 17mm 6mm; }
    /* Keep the header divider below both logos, as in the official template. */
    .brand-header { height: 24mm; padding-bottom: 3mm; border-bottom: 0.35mm solid #989898; display: flex; align-items: flex-start; justify-content: space-between; }
    .captain-logo { width: 39mm; height: 20mm; object-fit: contain; object-position: left top; }
    .saathi-logo { width: 52mm; height: 20mm; object-fit: contain; object-position: right top; }
    .title-block { margin: 3mm 0 0 3.5mm; }
    .saathi-heading { margin: 0; font-size: 12.4pt; font-weight: 700; line-height: 1.28; }
    .certificate-heading { margin: 0; font-size: 11.6pt; font-weight: 700; line-height: 1.34; }
    .issued-by { margin: 0; font-size: 11.5pt; line-height: 1.36; }
    /* Start the farmer photo below the header divider instead of crossing it. */
    .photo-box { position: absolute; top: 35mm; right: 20mm; width: 37.5mm; height: 45mm; border: 0.35mm solid #000; overflow: hidden; }
    .farmer-photo { display: block; width: 100%; height: 100%; object-fit: cover; }
    .welcome { margin: 17mm 0 0 3.5mm; font-size: 13pt; font-weight: 700; line-height: 1.25; }
    .copy { margin: 5mm 0 0 3.5mm; font-size: 11.2pt; line-height: 1.52; }
    .copy.congratulations { margin-top: 4mm; font-weight: 700; }
    .copy.compact { margin-top: 5mm; text-align: justify; }
    .member-heading { margin: 5mm 0 1.2mm; font-size: 12.4pt; font-weight: 700; }
    .member-table, .signature-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    /*
      The official Word template has four fixed columns: 21.8%, 31%, 17.8%,
      and 29.4%. Defining them with a colgroup is essential: widths on td
      elements are discarded by WebView when the first two rows span columns.
    */
    .member-table .member-label-column { width: 21.8%; }
    .member-table .member-value-column { width: 31%; }
    .member-table .member-right-label-column { width: 17.8%; }
    .member-table .member-right-value-column { width: 29.4%; }
    .member-table td { border: 0.25mm solid #000; height: 7.75mm; padding: 1.2mm 1.8mm; font-size: 10.1pt; line-height: 1.08; vertical-align: middle; overflow-wrap: break-word; }
    .criteria-heading { margin: 4mm 0 1.2mm; font-size: 12.2pt; font-weight: 700; }
    .criteria-row { display: flex; align-items: flex-start; margin: 1.3mm 0 0 3.5mm; font-family: 'Times New Roman', serif; font-size: 10.45pt; line-height: 1.34; }
    .criteria-key { display: inline-flex; flex: 0 0 8.5mm; align-items: center; white-space: nowrap; }
    .criteria-box { display: inline-flex; width: 3.3mm; height: 3.3mm; margin-left: 0.7mm; border: 0.2mm solid #000; align-items: center; justify-content: center; font-family: Arial, Helvetica, sans-serif; font-size: 3.2mm; font-weight: 700; line-height: 1; }
    .criteria-box.checked::after { content: '✓'; }
    .criteria-copy { flex: 1; }
    .criteria-continuation { margin: 0 0 0 12mm; font-family: 'Times New Roman', serif; font-size: 10.45pt; line-height: 1.34; }
    .benefits-heading { margin: 3mm 0 8mm 3.5mm; font-size: 12.5pt; font-weight: 700; }
    .benefit-category { margin: 0 0 1.5mm 3.5mm; font-size: 11.2pt; font-weight: 700; }
    .benefit-list { margin: 0 0 6mm 3.5mm; padding: 0; list-style: none; font-size: 11pt; line-height: 1.53; }
    .benefit-list li::before { content: '➢'; display: inline-block; width: 7mm; }
    .relationship-extra { margin-left: 3mm; }
    .section-heading { margin: 8mm 0 2mm 3.5mm; font-size: 12.3pt; font-weight: 700; }
    .section-copy { margin: 0 0 0 3.5mm; font-size: 10.9pt; line-height: 1.5; }
    .signature-table { margin-top: 8mm; }
    .signature-table td { border: 0.25mm solid #555; padding: 2mm; font-size: 10.8pt; font-weight: 700; vertical-align: top; }
    .signature-table .signature-label { width: 38%; }
    .signature-table .signature-space { height: 29mm; }
    .signature-table .dealer-space { height: 25mm; }
    .signature-table .date-space { height: 8mm; vertical-align: middle; }
    @media print {
      html, body { background: #fff; }
      .page { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <section class="page page-one">
    <div class="brand-header">
      <img class="captain-logo" src="${escapeHtml(
        captainLogoUri
      )}" alt="Captain Tractors" />
      <img class="saathi-logo" src="${escapeHtml(
        saathiLogoUri
      )}" alt="Captain Saathi" />
    </div>
    <div class="title-block">
      <p class="saathi-heading">CAPTAIN SAATHI</p>
      <p class="certificate-heading">Official Membership Certificate &amp; Agreement</p>
      <p class="issued-by"><strong>Issued by:</strong> Captain Tractors Pvt. Ltd.</p>
    </div>
    <div class="photo-box">${
      farmerPhotoUri
        ? `<img class="farmer-photo" src="${escapeHtml(
            farmerPhotoUri
          )}" alt="" />`
        : ""
    }</div>
    <p class="welcome">WELCOME TO CAPTAIN SAATHI</p>
    <p class="copy">Dear Captain Customer,</p>
    <p class="copy congratulations">Congratulations!</p>
    <p class="copy compact">You have been officially recognized as a Captain Saathi, a prestigious loyalty and brand ambassador member of Captain Tractors Pvt. Ltd.</p>
    <p class="copy compact">Captain Saathi represents our appreciation for customers who have shown trust, loyalty, and continuous support towards the Captain brand. Through this membership, we look forward to building a long-term relationship with you while working together for the growth of Indian agriculture and the Captain family.</p>
    <p class="member-heading">Member Details:</p>
    <table class="member-table">
      <colgroup>
        <col class="member-label-column" />
        <col class="member-value-column" />
        <col class="member-right-label-column" />
        <col class="member-right-value-column" />
      </colgroup>
      <tr><td class="label">Membership No.:</td><td class="value" colspan="3">${certificateValue(
        membershipNo
      )}</td></tr>
      <tr><td class="label">Member Name:</td><td class="value" colspan="3">${certificateValue(
        memberName
      )}</td></tr>
      <tr><td class="label">Village:</td><td class="value">${certificateValue(
        village
      )}</td><td class="right-label">Taluka:</td><td class="right-value">${certificateValue(
  taluka
)}</td></tr>
      <tr><td class="label">District:</td><td class="value">${certificateValue(
        district
      )}</td><td class="right-label">State:</td><td class="right-value">${certificateValue(
  state
)}</td></tr>
      <tr><td class="label">Mobile No.:</td><td class="value">${certificateValue(
        mobile
      )}</td><td class="right-label">WhatsApp No.:</td><td class="right-value">${certificateValue(
  whatsapp
)}</td></tr>
      <tr><td class="label">Dealership Name:</td><td class="value">${certificateValue(
        dealershipName
      )}</td><td class="right-label">Location:</td><td class="right-value">${certificateValue(
  location
)}</td></tr>
      <tr><td class="label">Dealer Name:</td><td class="value">${certificateValue(
        dealerName
      )}</td><td class="right-label">Dealer Code:</td><td class="right-value">${certificateValue(
  dealerCode
)}</td></tr>
      <tr><td class="label">Membership Date:</td><td class="value">${certificateValue(
        membershipDate
      )}</td><td class="right-label">Valid Till:</td><td class="right-value">${certificateValue(
  validTill
)}</td></tr>
    </table>
    <p class="criteria-heading">Captain Saathi Selection Criteria:</p>
    ${selectionCriteria
      .map(
        (criterion) =>
          '<div class="criteria-row"><span class="criteria-key">' +
          criterion.code +
          '<span class="criteria-box ' +
          (selectedCriterion === criterion.code ? "checked" : "") +
          '"></span></span><span class="criteria-copy">' +
          criterion.text +
          "</span></div>"
      )
      .join("")}
    <p class="criteria-continuation">Customers specially recommended by an Authorized Captain Dealer and approved by Captain Tractors Pvt. Ltd.</p>
  </section>
  <section class="page page-two">
    <div class="brand-header">
      <img class="captain-logo" src="${escapeHtml(
        captainLogoUri
      )}" alt="Captain Tractors" />
      <img class="saathi-logo" src="${escapeHtml(
        saathiLogoUri
      )}" alt="Captain Saathi" />
    </div>
    <p class="benefits-heading">Member Benefits:</p>
    <p class="benefit-category">Recognition Benefits</p>
    <ul class="benefit-list">
      <li>Captain Saathi Certificate</li><li>Personalized Memento</li><li>Captain Saathi Badge</li><li>Home Name Plate</li><li>Spotlight Magazine Recognition</li><li>Social Media Recognition</li>
    </ul>
    <p class="benefit-category">Service Benefits</p>
    <ul class="benefit-list">
      <li>Free Annual Tractor Health Check-up</li><li>10% Discount on Genuine Captain Spare Parts</li><li>Considering Product &amp; Service Improvement Suggestions</li>
    </ul>
    <p class="benefit-category">Relationship Benefits</p>
    <ul class="benefit-list">
      <li>Festival Greetings</li><li>Festival Gift Program</li><li>Birthday Gift &amp; Greetings <span class="relationship-extra">➢&nbsp;&nbsp;Special Gifts for Family</span></li>
    </ul>
    <p class="section-heading">Referral Recognition:</p>
    <p class="section-copy">Captain Saathi Members contributing through referrals may be recognized through certificates, gifts, awards, event invitations and other recognition programs as decided by the Company.</p>
    <p class="section-heading">Your Voice Matters:</p>
    <p class="section-copy">Your suggestions regarding Captain products and services are valuable and may be considered for future improvements.</p>
    <p class="section-heading">Membership Validity:</p>
    <p class="section-copy">Membership is valid for three (3) years and may be renewed as per Company policy.</p>
    <p class="section-heading">Declaration:</p>
    <p class="section-copy">I confirm that the information provided is true and I accept the terms and benefits of the Captain Saathi Program.</p>
    <table class="signature-table">
      <tr><td class="signature-label signature-space">Captain Saathi Member Signature:</td><td class="signature-space"></td></tr>
      <tr><td class="signature-label dealer-space">Authorized Captain Tractor’s<br />Dealer Signature:</td><td class="dealer-space"></td></tr>
      <tr><td class="signature-label date-space">Date:</td><td class="date-space">${certificateValue(
        signatureDate
      )}</td></tr>
    </table>
  </section>
  <script>
    (function () {
      var sent = false;
      function notifyReady() {
        if (!sent && window.ReactNativeWebView) {
          sent = true;
          window.ReactNativeWebView.postMessage('certificate-ready');
        }
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', notifyReady, { once: true });
      } else {
        notifyReady();
      }
      // A photo can be slow or unavailable. The document itself is still
      // usable, so never wait for image requests before releasing the preview.
      window.setTimeout(notifyReady, 1200);
    })();
  </script>
</body>
</html>`;

export default function SaathiMembershipCertificateScreen() {
  const insets = useSafeAreaInsets();
  const { moderateScale } = useDeviceMetrics();
  const navigation = useNavigation<CertificateNavigation>();
  const route = useRoute<CertificateRoute>();
  const { farmer, dealer } = route.params;
  const source = farmer?.raw || farmer || {};
  const categoryValue = firstValue(
    source?.category,
    source?.category_id,
    source?.categoryId,
    source?.saathiCategory,
    source?.saathi_category,
    source?.location_details?.category,
    source?.location_details?.category_id,
    source?.locationDetails?.category,
    source?.locationDetails?.categoryId
  );
  const categoryId = categoryIdFrom(categoryValue);
  const directCategoryName = categoryNameFrom(categoryValue);
  // Add Farmer sends `Address`; some update/API responses use `address`.
  // Keep both shapes available when resolving the certificate location rows.
  const farmerAddress = useMemo(() => {
    const addresses = [
      source?.Address,
      source?.address,
      source?.address_details,
      source?.addressDetails,
    ];
    return (
      addresses.find(
        (address) =>
          address && typeof address === "object" && !Array.isArray(address)
      ) ||
      addresses.find((address) => typeof address === "string") ||
      {}
    );
  }, [source]);
  const [locations, setLocations] = useState<LocationNames>({});
  const [resolvedCategory, setResolvedCategory] =
    useState<CertificateCategory | null>(null);
  const [categoryReady, setCategoryReady] = useState(
    !categoryId || Boolean(directCategoryName)
  );
  const [brandAssets, setBrandAssets] = useState<BrandAssets>(
    androidBrandAssetFallback
  );
  const [brandAssetsReady, setBrandAssetsReady] = useState(
    Platform.OS !== "android" || !certificatePdf?.getBrandAssets
  );
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const previewSnapshotCreated = useRef(false);
  const previewLoadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  useEffect(() => {
    let mounted = true;
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        // A certificate is still useful if the logo bridge is unavailable.
        // Do not leave the dealer on a loading screen in that case.
        setBrandAssetsReady(true);
      }
    }, PREVIEW_BRAND_WAIT_MS);

    const finishBrandLoading = () => {
      clearTimeout(fallbackTimer);
      if (mounted) {
        setBrandAssetsReady(true);
      }
    };

    const loadBrandAssets = async () => {
      if (Platform.OS !== "android" || !certificatePdf?.getBrandAssets) {
        finishBrandLoading();
        return;
      }

      try {
        const assets = await resolveWithin(certificatePdf.getBrandAssets());
        if (mounted && assets?.captainLogoUri && assets?.saathiLogoUri) {
          setBrandAssets(assets);
        }
      } catch (error) {
        console.warn(
          "[SaathiMembershipCertificateScreen] Unable to load certificate logos:",
          error
        );
      } finally {
        finishBrandLoading();
      }
    };

    loadBrandAssets();
    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        // The category checkbox is important, but the screen must still open
        // when the categories API is temporarily unavailable.
        setCategoryReady(true);
      }
    }, PREVIEW_CATEGORY_WAIT_MS);

    const finishCategoryLoading = () => {
      clearTimeout(fallbackTimer);
      if (mounted) {
        setCategoryReady(true);
      }
    };

    const loadCategory = async () => {
      if (!categoryId) {
        if (mounted) {
          setResolvedCategory(null);
        }
        finishCategoryLoading();
        return;
      }

      if (directCategoryName) {
        if (mounted) {
          setResolvedCategory({ id: categoryId, name: directCategoryName });
        }
        finishCategoryLoading();
        return;
      }

      try {
        const response = await resolveWithin(
          getData(Apis.DEALER_CATEGORIES, {}),
          PREVIEW_CATEGORY_WAIT_MS
        );
        const categories = Array.isArray(response?.data) ? response.data : [];
        const selectedCategory = categories.find(
          (category: any) =>
            String(
              firstValue(
                category?.id,
                category?.category_id,
                category?.categoryId,
                category?.value
              )
            ) === String(categoryId)
        );

        if (mounted) {
          setResolvedCategory(
            selectedCategory
              ? {
                  id: categoryId,
                  name: categoryNameFrom(selectedCategory),
                }
              : null
          );
        }
      } catch (error) {
        console.warn(
          "[SaathiMembershipCertificateScreen] Unable to load category:",
          error
        );
      } finally {
        finishCategoryLoading();
      }
    };

    loadCategory();
    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [categoryId, directCategoryName]);

  const locationValues = useMemo(
    () => ({
      state: firstValue(
        source?.state_data,
        source?.stateData,
        source?.state_name,
        source?.stateName,
        source?.location_details?.state,
        source?.locationDetails?.state,
        farmerAddress?.state_data,
        farmerAddress?.state_name,
        source?.state,
        source?.stateId,
        source?.state_id,
        farmerAddress?.state
      ),
      district: firstValue(
        source?.district_data,
        source?.districtData,
        source?.district_name,
        source?.districtName,
        source?.location_details?.district,
        source?.locationDetails?.district,
        farmerAddress?.district_data,
        farmerAddress?.district_name,
        source?.district,
        source?.districtId,
        source?.district_id,
        farmerAddress?.district
      ),
      taluka: firstValue(
        source?.taluka_data,
        source?.talukaData,
        source?.taluka_name,
        source?.talukaName,
        source?.location_details?.taluka,
        source?.locationDetails?.taluka,
        farmerAddress?.taluka_data,
        farmerAddress?.taluka_name,
        source?.taluka,
        source?.talukaId,
        source?.taluka_id,
        farmerAddress?.taluka
      ),
      village: firstValue(
        source?.village_data,
        source?.villageData,
        source?.village_name,
        source?.villageName,
        source?.location_details?.village,
        source?.locationDetails?.village,
        farmerAddress?.village_data,
        farmerAddress?.village_name,
        source?.village,
        source?.villageId,
        source?.village_id,
        farmerAddress?.village
      ),
    }),
    [source, farmerAddress]
  );

  const directLocations = useMemo<LocationNames>(
    () => ({
      state: nameFromLocationValue(locationValues.state),
      district: nameFromLocationValue(locationValues.district),
      taluka: nameFromLocationValue(locationValues.taluka),
      village: nameFromLocationValue(locationValues.village),
    }),
    [locationValues]
  );

  useEffect(() => {
    let mounted = true;

    const findName = (response: any, id: string) => {
      const options = Array.isArray(response?.data) ? response.data : [];
      return nameFromLocationValue(
        options.find((option: any) => String(option?.id) === String(id))
      );
    };

    const loadLocationNames = async () => {
      const stateId = idFromLocationValue(locationValues.state);
      const districtId = idFromLocationValue(locationValues.district);
      const talukaId = idFromLocationValue(locationValues.taluka);
      const villageId = idFromLocationValue(locationValues.village);
      const resolved: LocationNames = { ...directLocations };

      if (
        (!stateId || resolved.state) &&
        (!districtId || resolved.district) &&
        (!talukaId || resolved.taluka) &&
        (!villageId || resolved.village)
      ) {
        if (mounted) {
          setLocations(resolved);
        }
        return;
      }

      try {
        const [
          stateResponse,
          districtResponse,
          talukaResponse,
          villageResponse,
        ] = await Promise.all([
          !resolved.state && stateId
            ? resolveWithin(getData(Apis.GET_STATES, {}))
            : Promise.resolve(undefined),
          !resolved.district && stateId && districtId
            ? resolveWithin(getData(`${Apis.GET_DISTRICTS}/${stateId}`, {}))
            : Promise.resolve(undefined),
          !resolved.taluka && districtId && talukaId
            ? resolveWithin(getData(`${Apis.GET_TALUKAS}/${districtId}`, {}))
            : Promise.resolve(undefined),
          !resolved.village && talukaId && villageId
            ? resolveWithin(getData(`${Apis.GET_VILLAGES}/${talukaId}`, {}))
            : Promise.resolve(undefined),
        ]);

        if (!resolved.state && stateId) {
          resolved.state = findName(stateResponse, stateId);
        }
        if (!resolved.district && districtId) {
          resolved.district = findName(districtResponse, districtId);
        }
        if (!resolved.taluka && talukaId) {
          resolved.taluka = findName(talukaResponse, talukaId);
        }
        if (!resolved.village && villageId) {
          resolved.village = findName(villageResponse, villageId);
        }
      } catch (error) {
        console.warn(
          "[SaathiMembershipCertificateScreen] Unable to resolve location names:",
          error
        );
      } finally {
        if (mounted) {
          setLocations(resolved);
        }
      }
    };

    loadLocationNames();
    return () => {
      mounted = false;
    };
  }, [directLocations, locationValues]);

  const fullName = textValue(
    farmer?.fullName,
    source?.fullName,
    source?.full_name,
    [source?.firstName, source?.middleName, source?.lastName]
      .filter(Boolean)
      .join(" ")
  );
  const membershipDateValue = firstValue(
    source?.membershipDate,
    source?.membership_date,
    source?.membershipStartDate,
    source?.membership_start_date,
    source?.approvedAt,
    source?.approved_at,
    source?.approvalDate,
    source?.approval_date,
    source?.verificationDate,
    source?.verification_date,
    source?.verifiedAt,
    source?.verified_at,
    source?.statusUpdatedAt,
    source?.status_updated_at,
    source?.registrationDate,
    source?.registration_date,
    source?.registeredAt,
    source?.registered_at,
    source?.createdAt,
    source?.created_at
  );
  const validTillValue = firstValue(
    source?.validTill,
    source?.valid_till,
    source?.validDate,
    source?.valid_date,
    source?.validUntil,
    source?.valid_until,
    source?.membershipValidTill,
    source?.membership_valid_till,
    source?.membershipExpiryDate,
    source?.membership_expiry_date,
    source?.validityDate,
    source?.validity_date,
    source?.expiryDate,
    source?.expiry_date
  );
  const membershipDate = formatDate(membershipDateValue);
  const membershipNo = textValue(
    source?.membershipId,
    source?.membership_id,
    source?.farmerId,
    source?.clientId,
    source?.client_id,
    farmer?.farmer_id,
    farmer?.id
  );
  const dealerName = textValue(
    dealer?.name,
    dealer?.dealer_name,
    dealer?.dealerName
  );
  const dealershipName = textValue(
    dealer?.firm_name,
    source?.dealershipName,
    farmer?.dealershipName,
    dealerName
  );
  const dealerDistrict = districtFromDealer(dealer);
  const farmerPhotoUri = imageUrlFrom(
    farmer?.profileImage,
    source?.profileImage,
    source?.profile_image,
    source?.profilePhoto,
    source?.profile_photo,
    source?.profile_photo_url,
    source?.profilePhotoUrl,
    source?.photo,
    source?.image
  );
  const farmerAddressText =
    typeof farmerAddress === "string" ? farmerAddress.trim() : "";
  const selectedCriterion = selectedCriterionCode(
    resolvedCategory?.name || directCategoryName
  );
  const approved =
    Number(
      firstValue(farmer?.verificationStatus, source?.verificationStatus)
    ) === 1;
  const captainLogoUri = brandAssets.captainLogoUri;
  const saathiLogoUri = brandAssets.saathiLogoUri;
  const certificateData = {
    farmerPhotoUri,
    membershipNo,
    memberName: fullName,
    village:
      locations.village || directLocations.village || farmerAddressText || "",
    taluka: locations.taluka || directLocations.taluka || "",
    district: locations.district || directLocations.district || "",
    state: locations.state || directLocations.state || "",
    mobile: textValue(
      source?.mobile,
      source?.mobileNumber,
      source?.mobile_number,
      source?.phone,
      farmer?.mobile
    ),
    whatsapp: textValue(
      source?.whatsapp,
      source?.whatsapp_no,
      source?.whatsappNo,
      source?.whatsapp_number,
      source?.whatsappNumber,
      source?.whatsAppNo,
      source?.mobile,
      source?.mobile_number
    ),
    dealershipName,
    location: dealerDistrict,
    dealerName,
    dealerCode: textValue(
      dealer?.dealer_id,
      dealer?.dealerId,
      dealer?.dealer_code,
      dealer?.dealerCode,
      dealer?.code
    ),
    membershipDate,
    validTill: formatDate(validTillValue) || validUntil(membershipDateValue),
    signatureDate: membershipDate,
    selectedCriterion,
  };
  const certificateHtml = useMemo(
    () =>
      buildCertificateHtml({
        captainLogoUri,
        saathiLogoUri,
        ...certificateData,
      }),
    [
      captainLogoUri,
      dealerDistrict,
      dealerName,
      dealershipName,
      directLocations,
      farmer?.mobile,
      fullName,
      locations,
      membershipDate,
      membershipDateValue,
      membershipNo,
      saathiLogoUri,
      selectedCriterion,
      source,
    ]
  );
  const printCertificateHtml = useMemo(
    () =>
      buildCertificateHtml({
        // Native code replaces these tokens using the app-owned Android
        // resources, producing data URIs that the PDF WebView can always load.
        captainLogoUri: "__CAPTAIN_TRACTORS_LOGO__",
        saathiLogoUri: "__CAPTAIN_SAATHI_LOGO__",
        ...certificateData,
      }),
    [certificateData]
  );

  // Open the certificate from the farmer data immediately. Location/category
  // lookups are optional enrichment and must not leave the dealer on a loader.
  // The snapshot deliberately stays immutable after it is mounted: replacing
  // WebView HTML as lookups finish is what caused the previous white flash.
  useEffect(() => {
    if (!brandAssetsReady || !categoryReady || previewSnapshotCreated.current) {
      return;
    }

    previewSnapshotCreated.current = true;
    setPreviewError(false);
    setPreviewLoading(true);
    setPreviewHtml(certificateHtml);
  }, [brandAssetsReady, categoryReady, certificateHtml]);

  const finishPreviewLoading = () => {
    if (previewLoadTimer.current) {
      clearTimeout(previewLoadTimer.current);
      previewLoadTimer.current = null;
    }
    setPreviewLoading(false);
  };

  // WebView callbacks normally clear the overlay straight away. This final
  // guard ensures that a device-specific WebView callback failure can never
  // cover a successfully rendered certificate forever.
  useEffect(() => {
    if (!previewHtml || !previewLoading) {
      return;
    }

    if (previewLoadTimer.current) {
      clearTimeout(previewLoadTimer.current);
    }
    previewLoadTimer.current = setTimeout(() => {
      console.warn(
        "[SaathiMembershipCertificateScreen] Preview load watchdog released the overlay."
      );
      previewLoadTimer.current = null;
      setPreviewLoading(false);
    }, PREVIEW_LOAD_TIMEOUT_MS);

    return () => {
      if (previewLoadTimer.current) {
        clearTimeout(previewLoadTimer.current);
        previewLoadTimer.current = null;
      }
    };
  }, [previewHtml, previewLoading, previewReloadKey]);

  useEffect(
    () => () => {
      if (previewLoadTimer.current) {
        clearTimeout(previewLoadTimer.current);
      }
    },
    []
  );

  const previewSource = useMemo(
    () => (previewHtml ? { html: previewHtml } : undefined),
    [previewHtml]
  );

  const retryPreview = () => {
    setPreviewError(false);
    setPreviewLoading(true);
    // Use the latest native logo data when retrying. The original snapshot may
    // have used a temporary fallback while the Android bridge was starting.
    setPreviewHtml(certificateHtml);
    setPreviewReloadKey((currentKey) => currentKey + 1);
  };

  const showToastMessage = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const openDownloadedCertificate = async (uri: string) => {
    if (!certificatePdf?.openCertificate) {
      showToastMessage(
        "Certificate opening is not available on this device.",
        "error"
      );
      return;
    }

    try {
      await certificatePdf.openCertificate(uri);
    } catch (error) {
      console.error(
        "[SaathiMembershipCertificateScreen] Opening certificate failed:",
        error
      );
      showToastMessage("Could not open the certificate PDF.", "error");
    }
  };

  const shareDownloadedCertificate = async (uri: string) => {
    if (!certificatePdf?.shareCertificate) {
      showToastMessage(
        "Certificate sharing is not available on this device.",
        "error"
      );
      return;
    }

    try {
      await certificatePdf.shareCertificate(uri);
    } catch (error) {
      console.error(
        "[SaathiMembershipCertificateScreen] Sharing certificate failed:",
        error
      );
      showToastMessage("Could not share the certificate PDF.", "error");
    }
  };

  const handleDownload = async () => {
    if (Platform.OS !== "android" || !certificatePdf?.save) {
      showToastMessage(
        "Certificate download is not available on this device.",
        "error"
      );
      return;
    }

    const safeId = (membershipNo || "Member").replace(/[^a-zA-Z0-9_-]/g, "_");
    setDownloadLoading(true);
    try {
      const savedCertificateUri = await certificatePdf.save(
        printCertificateHtml,
        `Saathi_Membership_Certificate_${safeId}.pdf`
      );
      Alert.alert(
        "Certificate downloaded",
        "Saved in your Downloads folder. You can open or share it now.",
        [
          { text: "Later", style: "cancel" },
          {
            text: "Share",
            onPress: () => {
              void shareDownloadedCertificate(savedCertificateUri);
            },
          },
          {
            text: "Open",
            onPress: () => {
              void openDownloadedCertificate(savedCertificateUri);
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "[SaathiMembershipCertificateScreen] Certificate PDF download failed:",
        error
      );
      const nativeMessage = String((error as Error | undefined)?.message || "");
      showToastMessage(
        nativeMessage.includes("WebView stopped")
          ? "Certificate download could not continue. Update Android System WebView, then try again."
          : "Could not save the certificate PDF. Please try again.",
        "error"
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  if (!approved) {
    return (
      <View style={styles.unavailableContainer}>
        <Ionicons
          name="time-outline"
          size={moderateScale(42)}
          color={colors.primary}
        />
        <Text
          style={[styles.unavailableTitle, { fontSize: moderateScale(20) }]}
        >
          Membership certificate unavailable
        </Text>
        <Text style={[styles.unavailableText, { fontSize: moderateScale(14) }]}>
          This certificate becomes available after Admin approval.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + moderateScale(10),
            paddingHorizontal: moderateScale(16),
          },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to farmer details"
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            { width: moderateScale(40), height: moderateScale(40) },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(20)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: moderateScale(20) }]}>
          Membership Certificate
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Download certificate as PDF"
          disabled={downloadLoading}
          onPress={handleDownload}
          style={[
            styles.downloadButton,
            { minWidth: moderateScale(40), height: moderateScale(40) },
            downloadLoading && styles.downloadButtonDisabled,
          ]}
        >
          {downloadLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons
              name="download-outline"
              size={moderateScale(21)}
              color={colors.primary}
            />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.previewContainer}>
        {previewSource && !previewError ? (
          <WebView
            key={previewReloadKey}
            source={previewSource}
            originWhitelist={["*"]}
            scalesPageToFit={true}
            cacheEnabled={true}
            setSupportMultipleWindows={false}
            overScrollMode="never"
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            onLoadStart={() => {
              setPreviewError(false);
              setPreviewLoading(true);
            }}
            onLoadProgress={(event) => {
              if (event.nativeEvent.progress >= 0.8) {
                finishPreviewLoading();
              }
            }}
            onLoadEnd={finishPreviewLoading}
            onMessage={(event) => {
              if (event.nativeEvent.data === "certificate-ready") {
                finishPreviewLoading();
              }
            }}
            onError={(error) => {
              console.warn(
                "[SaathiMembershipCertificateScreen] Certificate preview failed:",
                error.nativeEvent.description
              );
              finishPreviewLoading();
              setPreviewError(true);
            }}
            style={styles.webView}
          />
        ) : (
          <View style={styles.previewState}>
            {previewError ? (
              <>
                <Ionicons
                  name="document-text-outline"
                  size={moderateScale(42)}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.previewErrorText,
                    { fontSize: moderateScale(15) },
                  ]}
                >
                  Could not display the certificate.
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Retry certificate preview"
                  onPress={retryPreview}
                  style={styles.retryButton}
                >
                  <Text
                    style={[
                      styles.retryButtonText,
                      { fontSize: moderateScale(14) },
                    ]}
                  >
                    Try again
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <ActivityIndicator color={colors.primary} size="large" />
            )}
          </View>
        )}
        {previewLoading && !previewError && previewSource && (
          <View pointerEvents="none" style={styles.previewLoadingOverlay}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
      </View>
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.backgroundWhite,
  },
  headerTitle: {
    ...Typography.boldXl,
    color: colors.textPrimary,
  },
  downloadButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.backgroundWhite,
  },
  downloadButtonDisabled: {
    opacity: 0.65,
  },
  previewContainer: {
    flex: 1,
    position: "relative",
  },
  previewState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  previewLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundLight,
  },
  previewErrorText: {
    color: colors.textPrimary,
    fontFamily: "Gilroy-Regular",
    marginTop: 14,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 40,
    paddingHorizontal: 22,
  },
  retryButtonText: {
    color: colors.backgroundWhite,
    fontFamily: "Gilroy-SemiBold",
  },
  webView: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  unavailableContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 32,
  },
  unavailableTitle: {
    color: colors.textPrimary,
    fontFamily: "Gilroy-Bold",
    marginTop: 16,
    textAlign: "center",
  },
  unavailableText: {
    color: colors.textTertiary,
    fontFamily: "Gilroy-Regular",
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});
