"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--accent)",
              marginBottom: 8,
            }}
          >
            TenPhel
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "fixed",
          top: -150,
          right: -150,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,111,247,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(40,160,95,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image
            src="/image.png"
            alt="TenPhel"
            width={80}
            height={80}
            style={{ objectFit: "contain", width: "auto", height: "auto" }}
          />
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            TenPhel
          </h1>
        </div>
        <button
          onClick={() => router.push("/auth")}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--border-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          Sign In
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        {/* Hero Section */}
        <div style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 20,
              background: "linear-gradient(135deg, #7c6ff7, #a89eff)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Track Every Penny,
            <br />
            Master Your Finances
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "var(--text-secondary)",
              maxWidth: 600,
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            TenPhel helps you monitor your spending, understand your financial
            habits, and take control of your money with ease.
          </p>
          <button
            onClick={() => router.push("/auth?step=register")}
            style={{
              padding: "16px 32px",
              fontSize: 16,
              fontWeight: 600,
              background: "linear-gradient(135deg, #7c6ff7 0%, #5b4ee0 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(124,111,247,0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 15px 40px rgba(124,111,247,0.4)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 10px 30px rgba(124,111,247,0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Get Started Free
          </button>
        </div>

        {/* Features Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 32,
            marginBottom: 60,
          }}
        >
          {[
            {
              icon: "💰",
              title: "Track Spending",
              desc: "Log every expense and keep a detailed record of where your money goes.",
            },
            {
              icon: "📊",
              title: "View Categories",
              desc: "Organize expenses by categories to understand your spending patterns.",
            },
            {
              icon: "💵",
              title: "Monitor Balance",
              desc: "See your current balance and track remaining funds at a glance.",
            },
            {
              icon: "📈",
              title: "Financial Insights",
              desc: "Get a complete picture of your spending history and trends.",
            },
            {
              icon: "🎯",
              title: "Budget Control",
              desc: "Set limits on categories and stay within your financial goals.",
            },
            {
              icon: "🔒",
              title: "Secure & Private",
              desc: "Your financial data is encrypted and stored securely.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                padding: 28,
                background: "var(--bg-card)",
                borderRadius: 16,
                border: "1px solid var(--border)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div
          style={{
            padding: 48,
            background:
              "linear-gradient(135deg, rgba(124,111,247,0.1) 0%, rgba(91,78,224,0.05) 100%)",
            borderRadius: 20,
            border: "1px solid var(--border)",
            marginBottom: 40,
          }}
        >
          <h3
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 16,
            }}
          >
            Ready to Take Control?
          </h3>
          <p
            style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              marginBottom: 28,
            }}
          >
            Join thousands of students managing their finances smartly with
            TenPhel
          </p>
          <button
            onClick={() => router.push("/auth?step=register")}
            style={{
              padding: "16px 40px",
              fontSize: 16,
              fontWeight: 600,
              background: "linear-gradient(135deg, #7c6ff7 0%, #5b4ee0 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(124,111,247,0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 15px 40px rgba(124,111,247,0.4)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 10px 30px rgba(124,111,247,0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Sign Up Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          textAlign: "center",
          padding: "40px 24px 20px",
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        <p>© 2024 TenPhel. Smart Money Tracking for Students.</p>
      </div>
    </div>
  );
}
