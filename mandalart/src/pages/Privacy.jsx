import React from "react";
import PageHelmet from "../components/PageHelmet";

export default function Privacy() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px" }}>
      <PageHelmet
        title="Privacy Policy (GDPR)"
        description="How Mandalart handles personal data under GDPR."
        path="/Privacy"
      />

      <section
        style={{
          background: "white",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          lineHeight: 1.7,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Privacy Policy (GDPR)</h2>
        <p>
          This page explains how Mandalart processes personal data in line with the
          General Data Protection Regulation (GDPR).
        </p>

        <h3>What data we process</h3>
        <p>
          Depending on your activity, we may process your name, email address, phone
          number, shipping details, account details, and booking/order information.
        </p>

        <h3>Why we process data</h3>
        <p>
          We use your data to provide requested services: account access, workshop
          booking, order handling, customer support, and service notifications.
        </p>

        <h3>Legal basis</h3>
        <p>
          Processing is based on contract performance, legal obligations, and where
          required, your consent.
        </p>

        <h3>Data retention</h3>
        <p>
          We keep personal data only for as long as necessary to provide services and
          comply with legal/accounting obligations.
        </p>

        <h3>Your GDPR rights</h3>
        <p>
          You may request access, rectification, erasure, restriction, objection, and
          data portability, where applicable.
        </p>

        <h3>Contact</h3>
        <p>
          For privacy requests, use the Contact page and include "Privacy request" in
          the subject line.
        </p>
      </section>
    </main>
  );
}
