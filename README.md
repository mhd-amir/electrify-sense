# GridSync AI

You are an expert UI/UX designer and senior frontend engineer.

Design and build a futuristic, production-quality interactive web application that demonstrates an AI-Powered Digital Twin for National Power Grid Stability.

IMPORTANT:

This is a front-end demonstration only.

Do NOT build backend APIs.

Do NOT build machine learning.

Do NOT build Graph Neural Networks.

Do NOT build Reinforcement Learning.

Everything should be simulated with realistic dummy data.

The goal is to make the user feel like they are operating the national power grid.

-------------------------------------------------------

GENERAL REQUIREMENTS

Create an ultra-modern SCADA-style control center.

Dark Theme

Background:

#050816

Cards:

#101827

Accent Colors

Blue

Cyan

Green

Yellow

Orange

Red

Glassmorphism

Rounded cards

Smooth animations

Professional typography

Responsive layout

Professional spacing

No toy-like UI.

This should look like software used by national grid operators.

-------------------------------------------------------

HOME DASHBOARD

Display

National Grid Status

Overall Grid Health Score

95%

Animated circular gauge.

Current Demand

Current Generation

Frequency

Voltage

Renewable %

Carbon Emission

Power Loss

AI Confidence Score

Current Time

Weather Summary

Grid Stability Status

-------------------------------------------------------

LEFT SIDEBAR

Dashboard

Digital Twin

Power Plants

Substations

Transmission Lines

Consumers

Renewables

Battery Storage

EV Charging

AI Predictions

Alerts

Analytics

Settings

-------------------------------------------------------

DIGITAL TWIN PAGE

This is the main attraction.

Create a full-screen interactive network visualization.

Display

Power Plants

Solar Farms

Wind Farms

Hydro Plants

Battery Storage

Substations

Cities

Transmission Lines

Electricity Flow Animation

Nodes connected by animated glowing lines.

Hover over any node.

Show popup

Name

Voltage

Current

Temperature

Power

Health

Status

Click any node.

Open a detailed information drawer.

Allow zoom

Pan

Fit to screen

Highlight selected path

-------------------------------------------------------

TRANSMISSION LINES

Animated glowing lines.

Green

Normal

Yellow

Heavy Load

Red

Critical

Flashing Red

Failure

Electricity particles should move through the lines.

-------------------------------------------------------

POWER PLANTS

Display different icons.

Coal

Hydro

Solar

Wind

Nuclear

Battery

Each card shows

Generation

Capacity

Efficiency

Temperature

Health

Status

-------------------------------------------------------

SUBSTATIONS

Interactive cards

Incoming Power

Outgoing Power

Voltage

Current

Connected Lines

Health

-------------------------------------------------------

LIVE TELEMETRY

Every second

Randomly update

Voltage

Frequency

Current

Load

Temperature

Renewable Generation

Battery Level

Use smooth number animations.

-------------------------------------------------------

AI ALERTS

Right side panel.

Examples

High Load on Line 14

Transformer Temperature Rising

Battery Charge Low

Voltage Drop Detected

Wind Output Falling

Use animated notifications.

-------------------------------------------------------

AI RECOMMENDATIONS

Large AI assistant panel.

Display recommendations like

Increase Hydro Generation by 120 MW

Activate Battery Storage

Shift 80 MW to Northern Grid

Reduce Industrial Load by 5%

Schedule Transformer Maintenance

Every recommendation has

Priority

Reason

Confidence %

Impact

Accept button

Dismiss button

-------------------------------------------------------

GRID MAP

Show an interactive map.

Pins

Power Plants

Substations

Cities

Click any pin.

Show popup.

-------------------------------------------------------

ANALYTICS

Beautiful charts

Demand

Generation

Renewable %

Grid Stability

Power Loss

Carbon Emission

Load Distribution

Battery Charge

Daily Forecast

Weekly Forecast

-------------------------------------------------------

SIMULATION CONTROLS

Bottom control bar

Start Simulation

Pause

Reset

Speed

1x

2x

5x

10x

Random Failure

Storm Mode

Heatwave

Increase Demand

Decrease Demand

-------------------------------------------------------

FAILURE SIMULATION

User presses

Inject Failure

Select

Transmission Line

Substation

Power Plant

Simulate

Animation

Line becomes red

Nearby nodes blink

Electricity reroutes

Alert appears

AI Recommendation appears

Grid Stability decreases

-------------------------------------------------------

ANIMATIONS

Everything should feel alive.

Moving electricity particles

Live counters

Glowing nodes

Pulse effects

Smooth transitions

Hover animations

Floating cards

-------------------------------------------------------

DATA

Generate realistic fake telemetry.

Update every second.

Use realistic engineering values.

-------------------------------------------------------

TECH STACK

React

TypeScript

TailwindCSS

Framer Motion

React Flow

Recharts

Lucide Icons

No backend.

Everything simulated.

-------------------------------------------------------

FINAL GOAL

The result should look like software used by the National Power Grid Control Center.

When someone opens the application they should immediately think:

"This looks like a real AI control center managing the country's electricity network."

Focus on realism, beautiful visualization, interactivity, and smooth animations rather than AI implementation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/73daace7-cd29-4e53-9dad-fa4a9db039ec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
