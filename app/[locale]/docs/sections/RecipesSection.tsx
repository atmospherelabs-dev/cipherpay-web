'use client';

import { useState } from 'react';
import { Code, CodeBlock, Callout, SectionDivider, Paragraph, SectionTitle, Strong } from '../components/DocComponents';

type Lang = 'node' | 'python' | 'php';

function LangTabs({ active, onChange }: { active: Lang; onChange: (l: Lang) => void }) {
  const tabs: { id: Lang; label: string }[] = [
    { id: 'node', label: 'Node.js' },
    { id: 'python', label: 'Python' },
    { id: 'php', label: 'PHP' },
  ];
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '1px solid var(--cp-border)' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '6px 14px',
            fontSize: 10,
            fontWeight: active === t.id ? 600 : 400,
            fontFamily: 'var(--font-geist-mono)',
            letterSpacing: 0.5,
            color: active === t.id ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
            background: active === t.id ? 'rgba(6,182,212,0.08)' : 'transparent',
            border: 'none',
            borderBottom: active === t.id ? '2px solid var(--cp-cyan)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

const NODE_SERVER = `const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const API_KEY = process.env.CIPHERPAY_API_KEY;
const WEBHOOK_SECRET = process.env.CIPHERPAY_WEBHOOK_SECRET;
const API_URL = 'https://api.cipherpay.app';

// Simple in-memory store (use a real database in production)
const orders = new Map();

// 1. Serve the order form
app.get('/', (req, res) => {
  res.send(\`
    <form method="POST" action="/order">
      <input name="name" placeholder="Full name" required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="address" placeholder="Shipping address" required></textarea>
      <button type="submit">Pay with Zcash</button>
    </form>
  \`);
});

// 2. Create order + CipherPay invoice, redirect to checkout
app.post('/order', async (req, res) => {
  const { name, email, address } = req.body;
  const orderId = crypto.randomUUID();

  // Store buyer info locally — CipherPay never sees it
  orders.set(orderId, { name, email, address, status: 'pending' });

  // Create a CipherPay invoice with the order reference
  const invoice = await fetch(\`\${API_URL}/api/invoices\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_name: \`Order #\${orderId}\`,
      amount: 29.99,
      currency: 'USD',
    }),
  }).then(r => r.json());

  // Link invoice to order
  orders.get(orderId).invoiceId = invoice.id;

  // Redirect buyer to CipherPay checkout
  res.redirect(invoice.checkout_url);
});

// 3. Handle webhook — match payment to order, fulfill
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-cipherpay-signature'];
  const timestamp = req.headers['x-cipherpay-timestamp'];
  const body = JSON.stringify(req.body);

  // Verify HMAC signature
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(timestamp + '.' + body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).send('Invalid signature');
  }

  const { event, invoice_id } = req.body;

  if (event === 'confirmed') {
    // Find the order linked to this invoice
    for (const [orderId, order] of orders) {
      if (order.invoiceId === invoice_id) {
        order.status = 'paid';
        console.log(\`Order \${orderId} fulfilled for \${order.name}\`);
        // Ship to: order.address, confirm to: order.email
        break;
      }
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log('Store running on port 3000'));`;

const PYTHON_SERVER = `from flask import Flask, request, redirect, jsonify
import requests, hmac, hashlib, uuid, json

app = Flask(__name__)

API_KEY = "cpay_sk_YOUR_KEY"
WEBHOOK_SECRET = "whsec_YOUR_SECRET"
API_URL = "https://api.cipherpay.app"

orders = {}  # Use a real database in production

# 1. Serve the order form
@app.route("/")
def form():
    return """
    <form method="POST" action="/order">
      <input name="name" placeholder="Full name" required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="address" placeholder="Shipping address" required></textarea>
      <button type="submit">Pay with Zcash</button>
    </form>
    """

# 2. Create order + CipherPay invoice, redirect to checkout
@app.route("/order", methods=["POST"])
def create_order():
    name = request.form["name"]
    email = request.form["email"]
    address = request.form["address"]
    order_id = str(uuid.uuid4())[:8]

    # Store buyer info locally — CipherPay never sees it
    orders[order_id] = {
        "name": name, "email": email,
        "address": address, "status": "pending"
    }

    # Create a CipherPay invoice
    resp = requests.post(f"{API_URL}/api/invoices", json={
        "product_name": f"Order #{order_id}",
        "amount": 29.99,
        "currency": "USD",
    }, headers={"Authorization": f"Bearer {API_KEY}"})
    invoice = resp.json()

    orders[order_id]["invoice_id"] = invoice["id"]
    return redirect(invoice["checkout_url"])

# 3. Handle webhook — match payment to order, fulfill
@app.route("/webhook", methods=["POST"])
def webhook():
    signature = request.headers.get("X-CipherPay-Signature")
    timestamp = request.headers.get("X-CipherPay-Timestamp")
    body = request.get_data(as_text=True)

    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        f"{timestamp}.{body}".encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        return "Invalid signature", 401

    data = request.get_json()
    if data["event"] == "confirmed":
        for order_id, order in orders.items():
            if order.get("invoice_id") == data["invoice_id"]:
                order["status"] = "paid"
                print(f"Order {order_id} fulfilled for {order['name']}")
                break

    return "", 200

if __name__ == "__main__":
    app.run(port=3000)`;

const PHP_SERVER = `<?php
// config
$apiKey = 'cpay_sk_YOUR_KEY';
$webhookSecret = 'whsec_YOUR_SECRET';
$apiUrl = 'https://api.cipherpay.app';
$ordersFile = __DIR__ . '/orders.json';

// Simple file-based store (use a real database in production)
function loadOrders() {
    global $ordersFile;
    if (!file_exists($ordersFile)) return [];
    return json_decode(file_get_contents($ordersFile), true) ?: [];
}
function saveOrders($orders) {
    global $ordersFile;
    file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. Serve the order form
if ($path === '/' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo '<form method="POST" action="/order">
      <input name="name" placeholder="Full name" required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="address" placeholder="Shipping address" required></textarea>
      <button type="submit">Pay with Zcash</button>
    </form>';
    exit;
}

// 2. Create order + CipherPay invoice, redirect to checkout
if ($path === '/order' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $orderId = substr(bin2hex(random_bytes(4)), 0, 8);

    // Store buyer info locally — CipherPay never sees it
    $orders = loadOrders();
    $orders[$orderId] = [
        'name' => $_POST['name'],
        'email' => $_POST['email'],
        'address' => $_POST['address'],
        'status' => 'pending',
    ];

    // Create a CipherPay invoice
    $ch = curl_init("$apiUrl/api/invoices");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $apiKey",
            "Content-Type: application/json",
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'product_name' => "Order #$orderId",
            'amount' => 29.99,
            'currency' => 'USD',
        ]),
    ]);
    $invoice = json_decode(curl_exec($ch), true);
    curl_close($ch);

    $orders[$orderId]['invoice_id'] = $invoice['id'];
    saveOrders($orders);

    header("Location: " . $invoice['checkout_url']);
    exit;
}

// 3. Handle webhook — match payment to order, fulfill
if ($path === '/webhook' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $signature = $_SERVER['HTTP_X_CIPHERPAY_SIGNATURE'] ?? '';
    $timestamp = $_SERVER['HTTP_X_CIPHERPAY_TIMESTAMP'] ?? '';
    $body = file_get_contents('php://input');

    $expected = hash_hmac('sha256', "$timestamp.$body", $webhookSecret);

    if (!hash_equals($expected, $signature)) {
        http_response_code(401);
        exit('Invalid signature');
    }

    $data = json_decode($body, true);
    if ($data['event'] === 'confirmed') {
        $orders = loadOrders();
        foreach ($orders as $orderId => &$order) {
            if (($order['invoice_id'] ?? '') === $data['invoice_id']) {
                $order['status'] = 'paid';
                error_log("Order $orderId fulfilled for {$order['name']}");
                break;
            }
        }
        saveOrders($orders);
    }

    http_response_code(200);
    exit;
}

http_response_code(404);
echo 'Not found';`;

export default function RecipesSection() {
  const [lang, setLang] = useState<Lang>('node');

  return (
    <>
      <Paragraph>
        Ready-to-use integration patterns for common use cases. Each recipe is a complete, working example
        you can copy to your server and adapt.
      </Paragraph>

      <SectionTitle>Collect buyer info + accept payment</SectionTitle>
      <Paragraph>
        The most common request: collect a customer&apos;s name, email, and shipping address alongside a Zcash payment.
        Because CipherPay is privacy-first, buyer info stays on <Strong>your</Strong> server — CipherPay only handles the payment.
      </Paragraph>

      <Callout type="info">
        Your customer&apos;s personal information never leaves your server. CipherPay only sees the invoice amount
        and a product name you provide (which can be an order reference).
      </Callout>

      <SectionDivider />

      <SectionTitle>How it works</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4, marginBottom: 16 }}>
        1. Your site shows a form — name, email, shipping address (whatever you need)<br />
        2. On submit, your server stores the buyer info locally with an order ID<br />
        3. Your server calls <Code>POST /api/invoices</Code> to create a CipherPay invoice<br />
        4. Redirect the buyer to the CipherPay checkout page (<Code>checkout_url</Code>)<br />
        5. When payment confirms, CipherPay sends a <Code>confirmed</Code> webhook to your server<br />
        6. Your server matches the <Code>invoice_id</Code> back to the stored order and fulfills it
      </div>

      <SectionDivider />

      <SectionTitle>Full example</SectionTitle>
      <Paragraph>
        Each example below is a single-file server with three endpoints: a form page, an order creator that
        redirects to CipherPay checkout, and a webhook handler. Replace the API key and webhook secret
        with your own from the dashboard.
      </Paragraph>

      <LangTabs active={lang} onChange={setLang} />

      {lang === 'node' && (
        <>
          <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginBottom: 8 }}>
            Requires: <Code>npm install express</Code>
          </div>
          <CodeBlock lang="javascript" code={NODE_SERVER} />
        </>
      )}

      {lang === 'python' && (
        <>
          <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginBottom: 8 }}>
            Requires: <Code>pip install flask requests</Code>
          </div>
          <CodeBlock lang="python" code={PYTHON_SERVER} />
        </>
      )}

      {lang === 'php' && (
        <>
          <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginBottom: 8 }}>
            Works with PHP 7.4+ and the built-in server: <Code>php -S localhost:3000</Code>
          </div>
          <CodeBlock lang="php" code={PHP_SERVER} />
        </>
      )}

      <SectionDivider />

      <SectionTitle>Customizing</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 16 }}>
        <Strong>Different fields:</Strong> Add or remove form fields — phone, company, notes, T-shirt size.
        CipherPay doesn&apos;t care what you collect, because it never sees it.<br />
        <Strong>Different amounts:</Strong> Replace the hardcoded <Code>29.99</Code> with a cart total or product lookup.<br />
        <Strong>Multiple products:</Strong> Pass <Code>product_id</Code> or <Code>price_id</Code> instead
        of <Code>product_name</Code> to link invoices to products in your CipherPay catalog.<br />
        <Strong>Success page:</Strong> Add <Code>?return_url=https://mysite.com/thanks</Code> to the checkout URL
        to redirect buyers back to your site after payment.<br />
        <Strong>Database:</Strong> Replace the in-memory store with SQLite, PostgreSQL, MySQL, or any database.
      </div>

      <Callout type="tip">
        For a no-code option, use <Strong>payment links</Strong> from the dashboard. They handle checkout
        without any server-side code — but the buyer info collection stays on your end.
      </Callout>
    </>
  );
}
