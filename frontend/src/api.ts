import { API_URL } from "./constants"


export async function GenratePeer(display_string: string): Promise<string | undefined> {
    const data = {
        display_name: display_string
    };

    try {
        const response = await fetch(`${API_URL}/peer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        // 1. Handle HTTP errors (status codes 4xx or 5xx)
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            // Optionally, log the error body for debugging
            // console.error(await response.text());
            return undefined; // Return undefined instead of empty return for clarity
        }

        // 2. Parse the successful JSON body
        // Define the expected shape of the response
        interface PeerResponse {
            peer_id: string;
            // Add other expected properties here if necessary
        }
        
        const res: PeerResponse = await response.json();

        // 3. Handle successful response but missing/invalid data
        if (!res.peer_id || res.peer_id === "") {
            console.error("API response was successful but missing 'peer_id'.", res);
            return undefined;
        }

        return res.peer_id;
        
    } catch (error) {
        // 4. Handle Network errors (e.g., DNS failure, connection refused)
        console.error("Network or Fetch error:", error);
        return undefined;
    }
}


export async function GenrateRoom(peer_id: string, capacity: number): Promise<string | undefined> {
    
    // 1. Define the data payload according to the API requirements.
    const data = {
        room_owner_id: peer_id, // Using the provided peer_id as the room owner
        capacity: capacity
    };

    try {
        const response = await fetch(`${API_URL}/room`, {
            method: "POST",
            headers: {
                // Mandatory header for sending JSON data
                "Content-Type": "application/json"
            },
            // Convert the JavaScript object to a JSON string
            body: JSON.stringify(data)
        });

        // 2. Handle HTTP errors (4xx or 5xx status codes)
        if (!response.ok) {
            console.error(`HTTP Error during room creation: ${response.status} ${response.statusText}`);
            // Log the server's error response for debugging
            console.error(await response.text()); 
            return undefined;
        }

        // 3. Define the expected shape of the successful response
        interface RoomResponse {
            room_id: string;
            room_owner_id:string
            capacity:string
            // The API is expected to return the newly created room ID
        }
        
        // 4. Parse the successful JSON body
        const res: RoomResponse = await response.json();

        // 5. Validate the required data in the response
        if (!res.room_id || res.room_id === "") {
            console.error("API response was successful but missing 'room_id'.", res);
            return undefined;
        }

        // 6. Return the room ID
        return res.room_id;
        
    } catch (error) {
        // 7. Handle network errors (connection issues, DNS, etc.)
        console.error("Network or Fetch error during room creation:", error);
        return undefined;
    }
}


export function cleanMeetingValue(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';

    // Regex for the required ID format: rXXX-XXX-XXX
    // Assuming X is any alphanumeric character [a-zA-Z0-9].
    // This strictly checks for: 'r' + 3 chars + '-' + 3 chars + '-' + 3 chars.
    const strictIdPattern = /^r[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}$/;
    
    let meetingIdCandidate = trimmed;

    // --- 1. Attempt to parse as a URL ---
    try {
        const url = new URL(trimmed);
        
        const requiredHost = 'sinod.lexrunit.com';
        const requiredPathPrefix = '/j/';

        // Check if both the host and the path structure are correct
        if (url.hostname === requiredHost && url.pathname.startsWith(requiredPathPrefix)) {
            
            // Extract the last path segment (which should be the ID)
            const segments = url.pathname.split('/').filter(Boolean);
            const finalSegment = segments.pop();

            if (finalSegment) {
                meetingIdCandidate = finalSegment;
            } else {
                // URL was valid but ended unexpectedly (e.g., /j/)
                return ''; 
            }
        } else {
            // It's a URL, but the wrong host or path, so treat as invalid input.
            return '';
        }

    } catch (error) {
        // If the input is not a valid URL, it falls here. 
        // We continue using meetingIdCandidate (which is still the raw trimmed value)
    }

    // --- 2. Validate the extracted or raw ID ---
    if (strictIdPattern.test(meetingIdCandidate)) {
        // Success: The candidate (whether raw or extracted from URL) matches the pattern.
        return meetingIdCandidate;
    }

    // Fail: Did not match the strict ID pattern.
    return '';
}
