from typing import List
from fastapi import APIRouter, HTTPException
from backend.app.services.simulation_service import simulation_service
from backend.app.schemas import RoadSchema, NodeSchema

router = APIRouter(tags=["Road Network"])

@router.get("/roads", response_model=List[RoadSchema])
def get_all_roads():
    """Returns static road network topology."""
    roads = list(simulation_service.roads.values())
    return roads

@router.get("/roads/{segment_id}", response_model=RoadSchema)
def get_road(segment_id: str):
    """Returns static metadata for a specific road segment."""
    road = simulation_service.roads.get(segment_id)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road segment {segment_id} not found")
    return road

@router.get("/nodes", response_model=List[NodeSchema])
def get_all_nodes():
    """Returns network intersection nodes with geographical coordinates."""
    nodes = list(simulation_service.nodes.values())
    return nodes
