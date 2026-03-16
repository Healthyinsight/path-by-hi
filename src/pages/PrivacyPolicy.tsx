import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container py-6 max-w-2xl mx-auto">
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center text-sm font-medium"
          style={{
            color: "#5095AC",
            fontFamily: "'Merriweather Sans', sans-serif",
          }}
        >
          ← Back
        </button>

        {/* Header */}
        <h1
          style={{
            fontFamily: "'Merriweather', serif",
            fontSize: "26px",
            fontWeight: 700,
            color: "#1A2B32",
            marginBottom: "4px",
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            fontFamily: "'Merriweather Sans', sans-serif",
            fontSize: "13px",
            color: "#6B7B84",
            marginBottom: "16px",
          }}
        >
          The Path Tracker — a service by Healthy Insight
          <br />
          Last updated: March 16, 2026
        </p>

        <div
          className="rounded-2xl border bg-card px-5 py-5 space-y-4"
          style={{
            borderColor: "#E0E7EA",
            background:
              "linear-gradient(145deg, rgba(80,149,172,0.02), rgba(131,159,141,0.03))",
          }}
        >
          <SectionTitle>1. Who We Are</SectionTitle>
          <BodyText>
            The Path Tracker is a health and fitness platform operated by
            Healthy Insight (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;),
            based in Sweden.
          </BodyText>
          <BodyText>Website: healthyinsight.eu</BodyText>
          <BodyText>App: tracker.healthyinsight.eu</BodyText>
          <BodyText>Contact: filipb@healthyinsight.eu</BodyText>
          <BodyText>
            This Privacy Policy explains how we collect, use, store, and
            protect your personal data when you use The Path Tracker web
            application.
          </BodyText>

          <SectionTitle>2. What Data We Collect</SectionTitle>

          <SubTitle>2.1 Account Data</SubTitle>
          <BulletList
            items={[
              "Email address (used for authentication)",
              "Display name or trail name (set during onboarding)",
            ]}
          />

          <SubTitle>2.2 Profile Data</SubTitle>
          <BulletList
            items={[
              "Training archetype (e.g., Ironman, Wellness, Recomp)",
              "Selected disciplines (e.g., running, cycling, swimming)",
              "Goal date and training goals",
              "Body metrics you choose to provide (weight, height, body fat percentage)",
            ]}
          />

          <SubTitle>2.3 Health &amp; Fitness Data (Sensitive Data)</SubTitle>
          <BodyText>
            With your explicit consent, we process health-related data
            including:
          </BodyText>
          <BulletList
            items={[
              "From Garmin Connect (via Garmin Health API): heart rate, HRV, sleep data, Body Battery, stress levels, VO2max estimates, activity data (distance, duration, pace, calories), training zones",
              "Manual input: training logs, nutrition data, body measurements",
            ]}
          />
          <BodyText>
            This data is classified as special category data under Article 9 of
            the GDPR and is processed only with your explicit consent.
          </BodyText>

          <SubTitle>2.4 Technical Data</SubTitle>
          <BulletList
            items={[
              "Authentication tokens (managed by Supabase Auth)",
              "Device type and browser (for app optimization)",
            ]}
          />

          <SectionTitle>3. How We Use Your Data</SectionTitle>
          <BodyText>We use your data exclusively for the following purposes:</BodyText>
          <BulletList
            items={[
              "Account creation and authentication (Contractual necessity, Art. 6(1)(b))",
              "Generating personalized training schedules (Explicit consent, Art. 9(2)(a))",
              "Providing nutrition recommendations (Explicit consent, Art. 9(2)(a))",
              "Displaying recovery insights and health metrics (Explicit consent, Art. 9(2)(a))",
              "Syncing data from Garmin Connect (Explicit consent, Art. 9(2)(a))",
              "Improving the service (Legitimate interest, Art. 6(1)(f))",
            ]}
          />
          <BodyText>We do NOT:</BodyText>
          <BulletList
            items={[
              "Sell your personal data to third parties",
              "Use your health data for advertising",
              "Share your data with advertisers or data brokers",
              "Make automated decisions that produce legal effects",
            ]}
          />

          <SectionTitle>4. Third-Party Services</SectionTitle>
          <BulletList
            items={[
              "Supabase: Database, authentication, backend. Location: EU (Frankfurt)",
              "Vercel: App hosting and delivery. Technical data only. Location: Global CDN (EU primary)",
              "Garmin Health API: Syncing wearable fitness data. OAuth tokens. Location: Garmin servers (US/EU)",
              "Google OAuth: Optional sign-in method. Email address. Location: Google servers",
              "Resend: Transactional email (magic links). Email address. Location: US (AWS)",
            ]}
          />

          <SectionTitle>5. Data Storage and Security</SectionTitle>
          <BulletList
            items={[
              "All data is stored in Supabase (hosted PostgreSQL in EU — Frankfurt region)",
              "Row Level Security (RLS) ensures users can only access their own data",
              "Authentication is handled via magic links and OAuth — no passwords are stored",
              "All data transmission uses HTTPS/TLS encryption",
              "API keys and secrets are stored in environment variables, never in client-side code",
            ]}
          />

          <SectionTitle>6. Data Retention</SectionTitle>
          <BulletList
            items={[
              "Account data: Retained as long as your account is active. Deleted upon account deletion request.",
              "Health & fitness data: Retained as long as your account is active. You can request deletion at any time.",
              "Garmin sync data: Stored locally in our database. Revoking Garmin access stops new data from syncing. Existing data is retained until you request deletion.",
            ]}
          />

          <SectionTitle>7. Your Rights (GDPR)</SectionTitle>
          <BodyText>As a user based in the EU/EEA, you have the following rights:</BodyText>
          <BulletList
            items={[
              "Access — Request a copy of all your personal data (Art. 15)",
              "Rectification — Correct inaccurate personal data (Art. 16)",
              'Erasure — Request deletion of your data ("right to be forgotten") (Art. 17)',
              "Restriction — Restrict processing of your data (Art. 18)",
              "Portability — Receive your data in a machine-readable format (Art. 20)",
              "Withdraw consent — Revoke consent for health data processing at any time (Art. 7(3))",
              "Object — Object to processing based on legitimate interest (Art. 21)",
              "Lodge a complaint — File a complaint with the Swedish Authority for Privacy Protection (IMY) at imy.se",
            ]}
          />
          <BodyText>
            To exercise any of these rights, contact us at filipb@healthyinsight.eu. We will
            respond within 30 days.
          </BodyText>

          <SectionTitle>8. Garmin Connect Integration</SectionTitle>
          <BodyText>
            The Path Tracker integrates with Garmin Connect via the Garmin Health API to
            provide personalized training insights.
          </BodyText>
          <BulletList
            items={[
              "What we access: Activity summaries, sleep data, heart rate, HRV, Body Battery, stress levels, VO2max",
              "How: You authorize access via Garmin's OAuth flow. We receive data pushed by Garmin's servers.",
              "Revocation: You can disconnect Garmin at any time in your app settings or via Garmin Connect settings. This immediately stops data syncing.",
              "We do NOT access your Garmin account credentials, GPS tracks, or social data",
            ]}
          />

          <SectionTitle>9. Cookies and Tracking</SectionTitle>
          <BodyText>
            The Path Tracker is a Progressive Web App (PWA) and uses:
          </BodyText>
          <BulletList
            items={[
              "Authentication tokens stored in local storage (required for login)",
              "No third-party tracking cookies",
              "No analytics services (e.g., no Google Analytics)",
              "No advertising pixels",
            ]}
          />

          <SectionTitle>10. Children's Privacy</SectionTitle>
          <BodyText>
            The Path Tracker is not intended for children under 16. We do not knowingly
            collect data from children.
          </BodyText>

          <SectionTitle>11. Changes to This Policy</SectionTitle>
          <BodyText>
            We may update this Privacy Policy from time to time. Changes will be posted on
            this page with an updated &quot;Last updated&quot; date.
          </BodyText>

          <SectionTitle>12. Contact</SectionTitle>
          <BodyText>Healthy Insight</BodyText>
          <BodyText>Filip Berggren</BodyText>
          <BodyText>Email: filipb@healthyinsight.eu</BodyText>
          <BodyText>Website: healthyinsight.eu</BodyText>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Merriweather', serif",
        fontSize: "18px",
        fontWeight: 700,
        color: "#1A2B32",
        marginTop: "8px",
      }}
    >
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "'Merriweather', serif",
        fontSize: "15px",
        fontWeight: 600,
        color: "#1A2B32",
        marginTop: "6px",
      }}
    >
      {children}
    </h3>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Merriweather Sans', sans-serif",
        fontSize: "13px",
        color: "#3D4F58",
        lineHeight: 1.6,
      }}
    >
      {children}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="ml-5 list-disc space-y-1">
      {items.map((item) => (
        <li
          key={item}
          style={{
            fontFamily: "'Merriweather Sans', sans-serif",
            fontSize: "13px",
            color: "#3D4F58",
            lineHeight: 1.6,
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

