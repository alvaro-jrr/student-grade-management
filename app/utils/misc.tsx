import type { LinkProps } from "@remix-run/react";
import { forwardRef } from "react";
import { Link } from "@remix-run/react";

type AnchorProps = React.DetailedHTMLProps<
	React.AnchorHTMLAttributes<HTMLAnchorElement>,
	HTMLAnchorElement
>;

const AnchorOrLink = forwardRef<
	HTMLAnchorElement,
	AnchorProps & {
		reload?: boolean;
		to?: LinkProps["to"];
		prefetch?: LinkProps["prefetch"];
	}
>(function AnchorOrLink(props, ref) {
	const {
		to,
		href,
		download,
		reload = false,
		prefetch,
		children,
		...rest
	} = props;
	let toUrl = "";
	let shouldUserRegularAnchor = reload || download;

	if (!shouldUserRegularAnchor && typeof href === "string") {
		shouldUserRegularAnchor = href.includes(":") || href.startsWith("#");
	}

	if (!shouldUserRegularAnchor && typeof to === "string") {
		toUrl = to;
		shouldUserRegularAnchor = to.includes(":");
	}

	if (!shouldUserRegularAnchor && typeof to === "object") {
		toUrl = `${to.pathname ?? ""}${to.hash ? `#${to.hash}` : ""}${
			to.search ? `?${to.search}` : ""
		}`;
		shouldUserRegularAnchor = to.pathname?.includes(":");
	}

	if (shouldUserRegularAnchor) {
		return (
			<a {...rest} download={download} href={href ?? toUrl} ref={ref}>
				{children}
			</a>
		);
	} else {
		return (
			<Link prefetch={prefetch} to={to ?? href ?? ""} {...rest} ref={ref}>
				{children}
			</Link>
		);
	}
});

export { AnchorOrLink };
