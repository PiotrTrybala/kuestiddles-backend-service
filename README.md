# Kuestiddles Backend Service

This is main backend service used by Kuestiddles application frontend (Admin) and mobile application (Competition User)

# Main features
- API for managing all entities in the system: landmarks, uploads, quests, competitions
- API for participating in competitions made for competition's users

## API Routes - Admin

- /admin:
    - /v3:
        - POST / - create organization
        - /uploads:
            - GET /search
            - GET /:id/metadata
            - GET /:id/data
            - GET /:slug/metadata
            - POST /
            - DELETE /:id
            - DELETE /:slug
        - /games:
            - GET /search
            - GET /:id
            - GET /:slug
            - DELETE /:id
            - DELETE /:slug
            - POST /
            - PATCH /:id
            - PATCH /:id/assets
    
        - /landmarks:

        - /quests:
            
        - /competitions:
    - /payments:
        - GET /
        - POST /upgrade


# TODO List
- Add usage limits to all resources: landmarks, uploads, quests and competitions
- 
- 
- 

# Temp group competitions tokens

- borsuki: borsuk1 - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wZXRpdGlvbklkIjoiMTQ3YzZlZWItNjAwNi00YTMxLWEwMDEtYmFjNGZjMDRkNGVlIiwiZ3JvdXBJZCI6IjA1ZWQ3YmJiLTUwZTAtNDA5Mi1iOWU0LTY4NTgwZjViMmMwMSIsInVzZXJuYW1lIjoiYm9yc3VrMSIsImlhdCI6MTc4MzMzMjU1MywiZXhwIjoxNzgzNDE4OTUzfQ.mIRZiqe8Eys2IjJN9B_94JCSoetXSdZQQqo54A4Pouo
- rysie: rys1 - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wZXRpdGlvbklkIjoiMTQ3YzZlZWItNjAwNi00YTMxLWEwMDEtYmFjNGZjMDRkNGVlIiwiZ3JvdXBJZCI6IjI2MDNiNWVmLTMyZmYtNGUwNy05Yzg4LTFlMDFlZjRiYmRmMSIsInVzZXJuYW1lIjoicnlzMSIsImlhdCI6MTc4MzMzMjYwMiwiZXhwIjoxNzgzNDE5MDAyfQ.QlGfDd-w2rLOl5_2oNNerl2ptqRRvSYdZy7sKpzAWM8