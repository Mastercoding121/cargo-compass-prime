import { db } from "./db-client";
import { config as dotenvConfig } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, "../../.env.local") });

// Monitor state
let isMonitoring = false;
let monitorInterval: NodeJS.Timeout | null = null;

// Health check config
const CHECK_INTERVAL_MS = 30000; // 30 seconds
const HEALTH_HISTORY_LENGTH = 5;
const healthHistory = {
  appwrite: [] as boolean[],
  supabase: [] as boolean[],
};

// Calculate uptime percentage
function calculateUptime(provider: "appwrite" | "supabase"): number {
  const history = healthHistory[provider];
  if (history.length === 0) return 100;
  const healthyCount = history.filter((h) => h).length;
  return (healthyCount / history.length) * 100;
}

// Log health status
function logHealth() {
  const appwriteUptime = calculateUptime("appwrite");
  const supabaseUptime = calculateUptime("supabase");

  console.log(`[DB Monitor] Appwrite Uptime: ${appwriteUptime.toFixed(2)}%`);
  console.log(`[DB Monitor] Supabase Uptime: ${supabaseUptime.toFixed(2)}%`);
  console.log(`[DB Monitor] Active Provider: ${db.getActiveProvider()}`);
}

// Run health check
async function runHealthCheck() {
  try {
    const { appwrite, supabase } = await db.checkHealth();

    // Update history
    healthHistory.appwrite.push(appwrite);
    healthHistory.supabase.push(supabase);

    // Keep history within length limit
    if (healthHistory.appwrite.length > HEALTH_HISTORY_LENGTH) {
      healthHistory.appwrite.shift();
    }
    if (healthHistory.supabase.length > HEALTH_HISTORY_LENGTH) {
      healthHistory.supabase.shift();
    }

    logHealth();
  } catch (error) {
    console.error("[DB Monitor] Health check failed:", error);
  }
}

// Start monitoring
export function startMonitoring() {
  if (isMonitoring) {
    console.log("[DB Monitor] Already running");
    return;
  }

  isMonitoring = true;
  console.log("[DB Monitor] Starting monitoring...");
  runHealthCheck(); // Initial check
  monitorInterval = setInterval(runHealthCheck, CHECK_INTERVAL_MS);
}

// Stop monitoring
export function stopMonitoring() {
  if (!isMonitoring) return;
  isMonitoring = false;
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
  console.log("[DB Monitor] Stopped");
}

// Get current stats
export function getHealthStats() {
  return {
    appwrite: {
      isHealthy: healthHistory.appwrite.at(-1) ?? true,
      uptime: calculateUptime("appwrite"),
    },
    supabase: {
      isHealthy: healthHistory.supabase.at(-1) ?? true,
      uptime: calculateUptime("supabase"),
    },
  };
}
