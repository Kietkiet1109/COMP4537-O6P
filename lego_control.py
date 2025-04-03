#!/usr/bin/env python3
import socket
import sys
from ev3dev2.motor import LargeMotor, OUTPUT_A, OUTPUT_B, OUTPUT_C, OUTPUT_D, SpeedPercent, MoveTank
from time import sleep

HOST = '0.0.0.0'  # Listen on all interfaces # Change for each connection
PORT = 8000       # Pick a port to listen on

# Check connected motors
connected_motors = []

motor_ports = {
    'outA': OUTPUT_A,
    'outB': OUTPUT_B,
    'outC': OUTPUT_C,
    'outD': OUTPUT_D
}

for port_name, port in motor_ports.items():
    try:
        motor = LargeMotor(port)
        connected_motors.append(motor)
        print("LargeMotor detected on {}".format(port_name))
    except Exception:
        pass  # Motor not connected

# Use the first two detected motors as a tank drive
single_motor = connected_motors[0]
tank_drive = None
if len(connected_motors) >= 2:
    tank_drive = MoveTank(connected_motors[0].address, connected_motors[1].address)
    print("Using tank drive.")
else:
    print("Using single motor.")
    
def parse_command(command):
    try:
        unused, action = command.strip().lower().split(' ')
        return action.strip(), float(5)
    except Exception as e:
        print("Failed to parse command:", e)
        return None, None

def handle_command(command):
    action, rotations = parse_command(command)
    if action is None:
        print("Invalid command.")
        return

    print("Executing: {}, rotations: {}".format(action, rotations))

    if action == "forward":
        tank_drive.on_for_rotations(SpeedPercent(50), SpeedPercent(50), rotations)
    elif action == "backward":
        tank_drive.on_for_rotations(SpeedPercent(-50), SpeedPercent(-50), rotations)
    elif action == "left":
        tank_drive.on_for_rotations(SpeedPercent(0), SpeedPercent(-50), rotations)
    elif action == "right":
        tank_drive.on_for_rotations(SpeedPercent(-50), SpeedPercent(0), rotations)        
    else:
        print("Unknown action")

# Start server socket
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen(1)
    print("EV3 listening on {}:{}".format(HOST, PORT))

    conn, addr = s.accept()
    with conn:
        print("Connected by {}".format(addr))
        while True:
            data = conn.recv(1024)
            if not data:
                print("Disconnected")
                break
            command = data.decode('utf-8')
            print("Received:", command)
            handle_command(command)
