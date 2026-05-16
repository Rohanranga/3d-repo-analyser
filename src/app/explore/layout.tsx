export default function ExploreLayout({ children }: { children: React.ReactNode }) {
    // This layout intentionally omits the global Header, SpotlightEffect, etc.
    // so the 3D explorer fills the entire viewport without any UI chrome.
    return <>{children}</>;
}
