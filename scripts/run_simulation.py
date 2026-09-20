import sys
import os
import time
import asyncio

# Add root project path to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.services.simulation_service import simulation_service

async def main():
    print("=" * 60)
    print("SAATHI REAL-TIME TRAFFIC SIMULATION RUNNER")
    print("=" * 60)
    print("Starting simulation clock from 08:00...")
    simulation_service.start()

    try:
        step = 0
        while step < 12: # Run 1 hour of simulation (12 x 5 min)
            summary = simulation_service.get_summary()
            print(f"[{summary['timestamp']}] "
                  f"Avg Speed: {summary['average_speed_kmh']} km/h | "
                  f"Congestion: {summary['average_congestion_index']} | "
                  f"Active Incidents: {summary['active_incidents_count']} | "
                  f"Critical Roads: {summary['critical_roads_count']}")
            await asyncio.sleep(2.0)
            step += 1
    except KeyboardInterrupt:
        print("\nStopping simulation...")
    finally:
        simulation_service.pause()
        print("Simulation paused.")

if __name__ == "__main__":
    asyncio.run(main())
