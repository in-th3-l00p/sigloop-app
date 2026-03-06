import { sepolia } from "viem/chains";
const DEFAULT_ZERODEV_PROJECT_ID = "00f42aaa-bd75-486b-ad15-851fd20d6177";
export const SUPPORTED_CHAINS = [
    { id: "sepolia", chain: sepolia, chainId: 11155111 },
];
const CHAIN_MAP = Object.fromEntries(SUPPORTED_CHAINS.map((c) => [c.id, c]));
export function getChainConfig(chainSlug, projectId) {
    const config = CHAIN_MAP[chainSlug];
    if (!config) {
        throw new Error(`Unsupported chain: ${chainSlug}`);
    }
    const zProjectId = projectId || process.env.ZERODEV_PROJECT_ID || DEFAULT_ZERODEV_PROJECT_ID;
    return {
        chain: config.chain,
        rpcUrl: `https://rpc.zerodev.app/api/v3/${zProjectId}/chain/${config.chainId}`,
    };
}
