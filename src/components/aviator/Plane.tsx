import planeAsset from "@/assets/gk-plane.png.asset.json";
import { assetUrl } from "@/lib/asset-url";

type Props = {
  className?: string;
  spinning?: boolean;
};

/** GK Airwin plane — the owner's supplied artwork, shown exactly as provided. */
export function Plane({ className = "" }: Props) {
  return (
    <img
      src={assetUrl(planeAsset.url)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`${className} select-none object-contain`}
    />
  );
}
