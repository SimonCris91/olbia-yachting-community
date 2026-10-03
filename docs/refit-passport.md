# Passaporto Digitale Refit

Operational prototype for the Orbia IoT in Community demo boat. Open `/refit-passport`; the dashboard is the first screen of the module. The root OYC experience remains unchanged and links to the prototype from its home and sign-in screen.

## Demo vessel

- Vessel: Demo Boat Orbia
- Engine: Honda BF135
- Display: ASE 4.3
- Network: NMEA 2000
- Sensors: two analogue fuel sensors
- Area: Olbia / Costa Smeralda
- Output: Italian and English technical report

The 20 starter records are synthetic examples. They have a visible demo label and a simulated source; they are not real reports, invoices, delivery notes, photographs, diagnoses, or proof of work.

## Try the workflow

1. Filter the timeline by component, record type, or state.
2. Add an item and include its origin/source. A selected file is stored locally in this browser; prototype attachments are capped at 600 KB.
3. Review the deterministic text-classification preview. It makes no API request and does not establish a technical diagnosis.
4. Use the timeline controls to confirm the record, separately attest that an intervention was performed, and close a record. Each action requires an explicit user confirmation. Closing an item never attests that work was performed.
5. Select a component to inspect its related history and generate/download the bilingual report.

## Storage and limitations

Entries and small attachments use `localStorage` in the current browser only. They are not sent to the app server, shared with another device, backed up, or suitable for confidential documents. Clearing browser site data removes this local archive. Do not enter sensitive information in the demo.

The classifier uses simple local keyword rules. Its suggestions, risk notice, urgency display, and next-check reminder are informational UI only, not maintenance instructions. All preloaded entries start as `Da verificare`; no item or intervention is automatically confirmed or closed. “Dato confermato” and “intervento eseguito” are separate manual attestations.

This prototype has no account-bound server persistence, actual AI, document OCR, photo analysis, audit-grade signatures, shared workspaces, or production retention/access controls. Those require a later backend and privacy/security design.

## Development

From the repository root run `npm run dev` and open `http://localhost:3000/refit-passport`. Use `npm run build`, `npm run lint`, and `npm test` for local checks when the project Node/npm runtime is available.
