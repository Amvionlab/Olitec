USE warranty_db;

-- Clear existing data cleanly
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE warranties;
TRUNCATE TABLE products;
TRUNCATE TABLE users;
TRUNCATE TABLE support_requests;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Seed Users (Admin and Customers)
INSERT INTO users (id, name, email, mobile, password_hash, role, status, city, state) VALUES
(1, 'Olitec Administrator', 'admin@olitec.in', '9840644034', 'scrypt$16384$8$1$D3jIsA67iW6bqQYjOcTxwQ==$ui3zSfWtGjtXbiQvX7KWf5gfmXaxRtcGpc7405YOg2Lm/vtlGi1bzupcvHz5mZXhvgaRSmsg6wj5bpqJpUkFYA==', 'admin', 'active', 'Chennai', 'Tamil Nadu'),
(2, 'Priya Sharma', 'priya@example.com', '9843331543', 'scrypt$16384$8$1$Is87J8lKQuFUhhtwRR2D7A==$4r9R/L23BR2WzhmH7+cDg2E2bclEUMB9MnANNDT3fcpVKkPMKcQZepwMJB1kOW6weWy7E+VHH8uOhw/u1xcNHg==', 'customer', 'active', 'Bengaluru', 'Karnataka'),
(3, 'Arjun Mehta', 'arjun.mehta@example.com', '9820098200', 'scrypt$16384$8$1$Is87J8lKQuFUhhtwRR2D7A==$4r9R/L23BR2WzhmH7+cDg2E2bclEUMB9MnANNDT3fcpVKkPMKcQZepwMJB1kOW6weWy7E+VHH8uOhw/u1xcNHg==', 'customer', 'active', 'Mumbai', 'Maharashtra'),
(4, 'Vikram Sundaram', 'vikram.s@example.com', '9444012345', 'scrypt$16384$8$1$Is87J8lKQuFUhhtwRR2D7A==$4r9R/L23BR2WzhmH7+cDg2E2bclEUMB9MnANNDT3fcpVKkPMKcQZepwMJB1kOW6weWy7E+VHH8uOhw/u1xcNHg==', 'customer', 'active', 'Chennai', 'Tamil Nadu'),
(5, 'Ananya Roy', 'ananya.roy@example.com', '9830098300', 'scrypt$16384$8$1$Is87J8lKQuFUhhtwRR2D7A==$4r9R/L23BR2WzhmH7+cDg2E2bclEUMB9MnANNDT3fcpVKkPMKcQZepwMJB1kOW6weWy7E+VHH8uOhw/u1xcNHg==', 'customer', 'active', 'Kolkata', 'West Bengal');

-- 2. Seed Products (Product Master with real Olitec catalogue)
INSERT INTO products (id, slug, name, model_number, category, short_description, description, warranty_months, price_inr, is_active) VALUES
(1, 'oli-1h-series-3-6kw', 'OLI-1H Single-phase Hybrid Inverter', 'OLI-1H3L', 'Hybrid Inverters', 'Solar, storage and backup in one compact 3 to 6 kW unit.', 'Built for homes, shops, clinics and offices on single-phase supply. Runs loads from solar first, stores surplus in 48V battery.', 60, 68000.00, 1),
(2, 'oli-1h-series-5kw', 'OLI-1H Single-phase Hybrid Inverter (5 kW)', 'OLI-1H5L', 'Hybrid Inverters', 'Higher output 5 kW model with dual MPPTs and fast backup.', 'Up to 6 units in parallel, six-period time-of-use scheduling and quiet fanless operation below 35 dB.', 60, 84000.00, 1),
(3, 'oli-3h-series-15-30kw', 'OLI-3H Three-phase Hybrid Inverter', 'OLI-3H15H', 'Hybrid Inverters', 'Commercial-grade three-phase hybrid inverter with unbalanced load support.', 'Up to 60 kW PV input, dual high-voltage battery ports and full three-phase backup for commercial applications.', 60, 195000.00, 1),
(4, 'oli-3h-series-30kw', 'OLI-3H Three-phase Hybrid Inverter (30 kW)', 'OLI-3H30H', 'Hybrid Inverters', 'High-capacity 30 kW industrial hybrid inverter.', 'Ideal for schools, hospitals, factories, and commercial microgrids.', 60, 310000.00, 1),
(5, 'olb-512-lfp-battery-wall', 'OLB-5.12 LFP Battery Storage (Wall-Mount)', 'OLB-5.12W', 'Energy Storage', 'Safe, long-life 5.12 kWh lithium iron phosphate storage.', '51.2V 100Ah prismatic LiFePO4 cells certified to BIS and UN 38.3 with integrated intelligent BMS.', 120, 128000.00, 1),
(6, 'olb-512-lfp-battery-rack', 'OLB-5.12 LFP Battery Storage (Rack-Mount)', 'OLB-5.12R', 'Energy Storage', '3U 19-inch rack format 5.12 kWh battery pack.', 'Modular scalable battery system expandable up to 10 packs in parallel (51.2 kWh total).', 120, 124000.00, 1),
(7, 'powermax-1100-inverter', 'PowerMax 1100 Sine Wave Inverter', 'PM-1100-SW', 'Inverters', 'Pure sine wave home inverter for sensitive electronic appliances.', '1100 VA capacity with LCD status display and smart multi-stage charging.', 24, 7490.00, 1),
(8, 'tubular-150ah-battery', 'LongLife 150Ah Tall Tubular Battery', 'LL-TT-150', 'Batteries', 'Tall tubular inverter battery engineered for long power cuts.', 'High-density active material and low water-loss alloy for maximum cycle longevity.', 60, 14250.00, 1),
(9, 'aquapure-ro-plus', 'AquaPure RO+ Water Purifier', 'AP-RO-750', 'Water Purifiers', '7-stage RO + UV + UF purification with essential mineral balance.', 'Delivers safe drinking water up to 2000 ppm TDS with 8L food-grade antimicrobial storage tank.', 12, 15990.00, 1),
(10, 'breezecool-55l-cooler', 'BreezeCool 55L Desert Air Cooler', 'BC-DC-55', 'Air Coolers', 'Heavy-duty desert cooler with 3-sided honeycomb pads and 45ft throw.', 'Powerful airflow with low power consumption and inverter compatibility.', 12, 10990.00, 1),
(11, 'aerosilent-bldc-fan', 'AeroSilent BLDC Ceiling Fan', 'AS-BLDC-1200', 'Ceiling Fans', 'Super energy-efficient 28 W brushless DC ceiling fan with remote.', 'Saves up to 65% electricity, 5-star BEE rated with timer and reverse modes.', 36, 3990.00, 1),
(12, 'chefpro-750w-mixer-grinder', 'ChefPro 750W Mixer Grinder', 'CP-MG-750', 'Kitchen Appliances', 'Heavy-duty 750 W copper motor with 3 stainless steel jars.', 'Ventilated motor housing and overload protection for demanding daily kitchen prep.', 24, 4290.00, 1);

-- 3. Seed Sample Warranties
INSERT INTO warranties (
  id, warranty_number, user_id, customer_name, email, mobile,
  installation_address, product_id, product_model, serial_number,
  purchase_date, installation_date, dealer_name, dealer_contact,
  status, start_date, end_date, admin_remark, reviewed_by, reviewed_at, submitted_at
) VALUES
(1, 'WR-2026-00101', 2, 'Priya Sharma', 'priya@example.com', '9843331543',
 'No. 42, 4th Cross, Indiranagar, Bengaluru, Karnataka 560038',
 1, 'OLI-1H3L', 'OL-INV-2026-8812', '2026-01-15', '2026-01-18', 'Apex Solar Technologies', '9845012345',
 'active', '2026-01-15', '2031-01-15', 'Verified invoice and installation photograph.', 1, '2026-01-19 10:30:00', '2026-01-18 14:20:00'),

(2, 'WR-2026-00102', 2, 'Priya Sharma', 'priya@example.com', '9843331543',
 'No. 42, 4th Cross, Indiranagar, Bengaluru, Karnataka 560038',
 5, 'OLB-5.12W', 'OL-BAT-2026-9041', '2026-01-15', '2026-01-18', 'Apex Solar Technologies', '9845012345',
 'active', '2026-01-15', '2036-01-15', '10-year battery warranty activated.', 1, '2026-01-19 10:32:00', '2026-01-18 14:25:00'),

(3, 'WR-2026-00103', 3, 'Arjun Mehta', 'arjun.mehta@example.com', '9820098200',
 'Flat 802, Marina Heights, Worli, Mumbai, Maharashtra 400018',
 3, 'OLI-3H15H', 'OL-INV-2026-4419', '2026-02-10', '2026-02-12', 'Western Sun Power Pvt Ltd', '9821098210',
 'active', '2026-02-10', '2031-02-10', 'Commercial 3-phase installation verified.', 1, '2026-02-13 11:15:00', '2026-02-12 16:40:00'),

(4, 'WR-2026-00104', 4, 'Vikram Sundaram', 'vikram.s@example.com', '9444012345',
 '12A, Gandhi Nagar 2nd Main Road, Adyar, Chennai, Tamil Nadu 600020',
 2, 'OLI-1H5L', 'OL-INV-2026-7733', '2026-03-01', '2026-03-03', 'Sunlight Energy Hub', '9444055555',
 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-03 09:15:00'),

(5, 'WR-2026-00105', 4, 'Vikram Sundaram', 'vikram.s@example.com', '9444012345',
 '12A, Gandhi Nagar 2nd Main Road, Adyar, Chennai, Tamil Nadu 600020',
 6, 'OLB-5.12R', 'OL-BAT-2026-6621', '2026-03-01', '2026-03-03', 'Sunlight Energy Hub', '9444055555',
 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-03 09:20:00'),

(6, 'WR-2026-00106', 5, 'Ananya Roy', 'ananya.roy@example.com', '9830098300',
 'Block C, Salt Lake Sector 5, Kolkata, West Bengal 700091',
 9, 'AP-RO-750', 'AP-RO-2026-1188', '2026-03-02', '2026-03-02', 'Metro Water Solutions', '9830011111',
 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-04 15:10:00'),

(7, 'WR-2026-00107', 3, 'Arjun Mehta', 'arjun.mehta@example.com', '9820098200',
 'Gala 14, MIDC Industrial Area, Andheri East, Mumbai 400093',
 8, 'LL-TT-150', 'BT-LL-2026-0099', '2026-02-15', '2026-02-15', 'City Battery Mart', '9820044444',
 'rejected', NULL, NULL, 'Serial number does not match submitted GST invoice.', 1, '2026-02-18 14:00:00', '2026-02-16 11:00:00');

-- 4. Seed Sample Support Requests
INSERT INTO support_requests (ticket_number, user_id, category, subject, message, contact_name, contact_email, contact_mobile, status) VALUES
('SR-2026-0001', 2, 'installation', 'Inverter Wi-Fi dongle setup assistance', 'Need help connecting the OLI-1H Wi-Fi module to home router for app telemetry.', 'Priya Sharma', 'priya@example.com', '9843331543', 'resolved'),
('SR-2026-0002', 4, 'warranty_claim', 'Inquiry on battery expansion configuration', 'Planning to add a second OLB-5.12 pack. Confirming cable kit and parallel switch setup.', 'Vikram Sundaram', 'vikram.s@example.com', '9444012345', 'open');
