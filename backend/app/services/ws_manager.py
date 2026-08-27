from fastapi import WebSocket
from typing import List, Dict
import json

class ConnectionManager:
    def __init__(self):
        # Lưu các kết nối theo group (ví dụ: "admin", "client")
        self.active_connections: Dict[str, List[WebSocket]] = {
            "admin": [],
            "client": []
        }

    async def connect(self, websocket: WebSocket, group: str = "admin"):
        await websocket.accept()
        if group not in self.active_connections:
            self.active_connections[group] = []
        self.active_connections[group].append(websocket)

    def disconnect(self, websocket: WebSocket, group: str = "admin"):
        if group in self.active_connections and websocket in self.active_connections[group]:
            self.active_connections[group].remove(websocket)

    async def broadcast(self, message: dict, group: str = "admin"):
        # Chuyển đối tượng datetime sang chuỗi ISO format nếu cần
        text_data = json.dumps(message, default=str)
        if group in self.active_connections:
            for connection in self.active_connections[group]:
                try:
                    await connection.send_text(text_data)
                except Exception as e:
                    print(f"Error broadcasting to a websocket: {e}")
                    pass # Ignore broken connections

manager = ConnectionManager()
