# Mobile Field Interface - Wave 3 External Access
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a mobile-optimized field interface for real-time progress reporting, task management, and photo documentation specifically designed for construction field workers and subcontractors working on-site.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Wait for Subcontractor Access ready - spawn after subcontractor access complete):**
1. **Mobile-First UI Framework**: Responsive mobile interface with offline capabilities
2. **GPS Location Services**: Automatic location tracking and geo-tagging
3. **Camera Integration**: Photo capture with automatic metadata and organization
4. **Task Management Mobile**: Mobile task views with quick status updates

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Offline Data Sync**: Local storage and sync when connection available
6. **Push Notifications**: Real-time mobile notifications for task updates

---

## **📱 Mobile Field Interface Data Structure**

### **Enhanced Mobile Interface Schema**
```typescript
// types/mobileField.ts
export interface MobileSession {
  id: string
  user_id: string
  device_id: string
  
  // Session Information
  session_start: string
  session_end?: string
  location_tracking_enabled: boolean
  camera_permissions_granted: boolean
  
  // GPS Tracking
  current_location: GPSLocation
  location_history: GPSLocation[]
  geofence_areas: GeofenceArea[]
  location_accuracy: number
  
  // Device Information
  device_type: 'ios' | 'android'
  device_model: string
  app_version: string
  os_version: string
  
  // Offline Capabilities
  offline_mode: boolean
  pending_sync_items: PendingSyncItem[]
  last_sync_time: string
  sync_status: SyncStatus
  
  // Photo Management
  photos_taken: number
  photos_uploaded: number
  storage_used_mb: number
  auto_backup_enabled: boolean
}

export interface GPSLocation {
  latitude: number
  longitude: number
  altitude?: number
  accuracy: number
  timestamp: string
  address?: string
  site_area?: string
  verified_on_site: boolean
}

export interface GeofenceArea {
  id: string
  name: string
  project_id: string
  center_lat: number
  center_lng: number
  radius_meters: number
  entry_time?: string
  exit_time?: string
  total_time_inside: number
}

export interface PendingSyncItem {
  id: string
  type: 'photo' | 'task_update' | 'progress_report' | 'time_entry'
  data: any
  created_at: string
  retry_count: number
  file_size?: number
}

export type SyncStatus = 
  | 'synced'
  | 'pending'
  | 'syncing'
  | 'failed'
  | 'offline'
```

### **Mobile Field Task Interface**
```typescript
export interface MobileFieldTask {
  id: string
  task_id: string
  project_id: string
  
  // Mobile Specific
  offline_available: boolean
  last_viewed_mobile: string
  mobile_completion_percentage: number
  
  // Quick Actions
  quick_status_options: QuickStatusOption[]
  voice_notes_enabled: boolean
  photo_requirements: PhotoRequirement[]
  
  // Field Information
  work_location: WorkLocation
  required_tools: string[]
  safety_requirements: SafetyRequirement[]
  weather_dependent: boolean
  
  // Progress Tracking
  mobile_updates: MobileTaskUpdate[]
  time_entries: MobileTimeEntry[]
  photo_documentation: MobilePhoto[]
  
  // Coordination
  requires_supervision: boolean
  supervisor_contact: string
  emergency_contacts: EmergencyContact[]
}

export interface QuickStatusOption {
  status: string
  label: string
  icon: string
  requires_photo: boolean
  requires_comment: boolean
  completion_percentage: number
}

export interface PhotoRequirement {
  category: string
  description: string
  required_count: number
  example_photo?: string
  before_after_required: boolean
}

export interface WorkLocation {
  area_name: string
  floor?: string
  room?: string
  grid_reference?: string
  coordinates: GPSLocation
  access_instructions?: string
}

export interface SafetyRequirement {
  type: string
  description: string
  required_ppe: string[]
  hazard_level: 'low' | 'medium' | 'high' | 'critical'
  safety_briefing_required: boolean
}

export interface MobileTaskUpdate {
  id: string
  timestamp: string
  status_change: string
  completion_percentage: number
  notes?: string
  location: GPSLocation
  photos_attached: string[]
  voice_note?: string
  sync_status: SyncStatus
}

export interface MobileTimeEntry {
  id: string
  start_time: string
  end_time?: string
  break_duration: number
  location_verified: boolean
  activity_type: string
  notes?: string
  supervisor_verified: boolean
}

export interface EmergencyContact {
  name: string
  role: string
  phone: string
  available_hours: string
  response_priority: number
}
```

### **Mobile Photo Management Schema**
```typescript
export interface MobilePhoto {
  id: string
  local_path: string
  server_path?: string
  
  // Photo Information
  filename: string
  file_size: number
  mime_type: string
  width: number
  height: number
  
  // Metadata
  taken_at: string
  location: GPSLocation
  device_orientation: 'portrait' | 'landscape'
  flash_used: boolean
  
  // Project Context
  project_id: string
  task_id?: string
  scope_item_id?: string
  photo_category: PhotoCategory
  
  // Content Classification
  photo_type: PhotoType
  before_after_set?: string
  progress_stage: string
  quality_documentation: boolean
  
  // Processing
  thumbnail_generated: boolean
  compressed_version?: string
  ai_analysis_tags: string[]
  text_recognition_data?: string
  
  // Upload Status
  upload_status: UploadStatus
  upload_progress: number
  upload_retry_count: number
  upload_error?: string
  
  // Approval & Review
  requires_approval: boolean
  approved_by?: string
  approval_status: ApprovalStatus
  reviewer_comments?: string
  
  // Mobile Specific
  offline_available: boolean
  marked_for_deletion: boolean
  auto_backup_uploaded: boolean
}

export type PhotoCategory = 
  | 'progress'
  | 'quality_control'
  | 'safety_compliance'
  | 'before_after'
  | 'material_delivery'
  | 'issue_documentation'
  | 'completion_verification'

export type PhotoType = 
  | 'wide_shot'
  | 'detail_shot'
  | 'close_up'
  | 'measurement'
  | 'safety_violation'
  | 'material_defect'
  | 'weather_condition'

export type UploadStatus = 
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'failed'
  | 'queued'

export type ApprovalStatus = 
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'needs_retake'
```

---

## **🔧 Mobile Field Interface Components**

### **1. Mobile Dashboard Component**
```typescript
// components/mobile/MobileFieldDashboard.tsx
interface MobileFieldDashboardProps {
  currentLocation: GPSLocation
  activeTasks: MobileFieldTask[]
  pendingUploads: number
  connectionStatus: 'online' | 'offline'
}

export function MobileFieldDashboard({
  currentLocation,
  activeTasks,
  pendingUploads,
  connectionStatus
}: MobileFieldDashboardProps) {
  return (
    <div className="mobile-dashboard">
      {/* Location Status */}
      <LocationHeader 
        location={currentLocation}
        connectionStatus={connectionStatus}
      />
      
      {/* Quick Actions */}
      <QuickActionGrid>
        <QuickAction 
          icon="camera" 
          label="Take Photo" 
          badge={pendingUploads > 0 ? pendingUploads : undefined}
        />
        <QuickAction icon="tasks" label="My Tasks" />
        <QuickAction icon="clock" label="Time Entry" />
        <QuickAction icon="alert" label="Report Issue" />
      </QuickActionGrid>
      
      {/* Active Tasks */}
      <ActiveTasksList tasks={activeTasks} />
      
      {/* Sync Status */}
      <SyncStatusIndicator 
        pendingItems={pendingUploads}
        lastSync={new Date()}
      />
    </div>
  )
}
```

### **2. Mobile Camera Interface**
```typescript
// components/mobile/MobileCameraInterface.tsx
interface MobileCameraProps {
  taskId?: string
  photoCategory: PhotoCategory
  requirements: PhotoRequirement[]
  onPhotoTaken: (photo: MobilePhoto) => void
}

export function MobileCameraInterface({
  taskId,
  photoCategory,
  requirements,
  onPhotoTaken
}: MobileCameraProps) {
  const [currentLocation, setCurrentLocation] = useState<GPSLocation>()
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [gridOverlay, setGridOverlay] = useState(true)
  
  const handlePhotoCapture = async (imageData: string) => {
    const photo: MobilePhoto = {
      id: generateId(),
      local_path: await saveToLocalStorage(imageData),
      filename: generateFilename(taskId, photoCategory),
      taken_at: new Date().toISOString(),
      location: currentLocation!,
      photo_category: photoCategory,
      upload_status: 'pending',
      // ... other properties
    }
    
    onPhotoTaken(photo)
  }
  
  return (
    <div className="mobile-camera">
      <CameraViewfinder 
        gridOverlay={gridOverlay}
        flashEnabled={flashEnabled}
        onCapture={handlePhotoCapture}
      />
      
      <CameraControls>
        <PhotoRequirementsOverlay requirements={requirements} />
        <CaptureButton onPress={handlePhotoCapture} />
        <CameraSettings 
          flashEnabled={flashEnabled}
          onFlashToggle={setFlashEnabled}
          gridEnabled={gridOverlay}
          onGridToggle={setGridOverlay}
        />
      </CameraControls>
    </div>
  )
}
```

### **3. Offline Task Management**
```typescript
// components/mobile/OfflineTaskManager.tsx
interface OfflineTaskManagerProps {
  tasks: MobileFieldTask[]
  syncStatus: SyncStatus
  onTaskUpdate: (taskId: string, update: MobileTaskUpdate) => void
}

export function OfflineTaskManager({
  tasks,
  syncStatus,
  onTaskUpdate
}: OfflineTaskManagerProps) {
  const [pendingUpdates, setPendingUpdates] = useState<PendingSyncItem[]>([])
  
  const updateTaskStatus = async (
    taskId: string, 
    newStatus: string, 
    percentage: number
  ) => {
    const update: MobileTaskUpdate = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      status_change: newStatus,
      completion_percentage: percentage,
      location: await getCurrentLocation(),
      photos_attached: [],
      sync_status: syncStatus === 'offline' ? 'pending' : 'synced'
    }
    
    if (syncStatus === 'offline') {
      // Store locally for later sync
      await storeOfflineUpdate(taskId, update)
      setPendingUpdates(prev => [...prev, {
        id: generateId(),
        type: 'task_update',
        data: { taskId, update },
        created_at: new Date().toISOString(),
        retry_count: 0
      }])
    }
    
    onTaskUpdate(taskId, update)
  }
  
  return (
    <div className="offline-task-manager">
      <OfflineIndicator visible={syncStatus === 'offline'} />
      
      {tasks.map(task => (
        <MobileTaskCard 
          key={task.id}
          task={task}
          onStatusUpdate={(status, percentage) => 
            updateTaskStatus(task.id, status, percentage)
          }
          offlineMode={syncStatus === 'offline'}
        />
      ))}
      
      <PendingSyncIndicator 
        pendingItems={pendingUpdates}
        onRetrySync={handleRetrySync}
      />
    </div>
  )
}
```

### **4. GPS Location Services**
```typescript
// services/mobileLocation.ts
export class MobileLocationService {
  private watchId: number | null = null
  private currentLocation: GPSLocation | null = null
  private locationHistory: GPSLocation[] = []
  
  async startLocationTracking(): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported')
    }
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
    
    this.watchId = navigator.geolocation.watchPosition(
      this.handleLocationUpdate.bind(this),
      this.handleLocationError.bind(this),
      options
    )
  }
  
  private handleLocationUpdate(position: GeolocationPosition): void {
    const location: GPSLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || undefined,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString(),
      verified_on_site: this.isWithinGeofence(
        position.coords.latitude,
        position.coords.longitude
      )
    }
    
    this.currentLocation = location
    this.locationHistory.push(location)
    
    // Trigger location-based events
    this.checkGeofenceEntry(location)
    this.updateLocationInTasks(location)
  }
  
  private isWithinGeofence(lat: number, lng: number): boolean {
    // Implementation for geofence validation
    return true // Simplified for example
  }
  
  async getCurrentLocation(): Promise<GPSLocation> {
    if (this.currentLocation) {
      return this.currentLocation
    }
    
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GPSLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            verified_on_site: true
          }
          resolve(location)
        },
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }
  
  stopLocationTracking(): void {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }
}
```

---

## **📋 Implementation Instructions for Coordinator**

### **Phase 1: Mobile Framework Setup**
1. **Mobile-First UI Implementation**
   - Create responsive mobile layouts using Tailwind CSS
   - Implement touch-friendly interfaces with proper hit targets
   - Add mobile-specific navigation patterns
   - Create offline-first data management

2. **GPS Integration Setup**
   - Implement location services with proper permissions
   - Create geofence monitoring for project sites
   - Add location verification for time tracking
   - Implement automatic location tagging

### **Phase 2: Camera & Photo Management**
1. **Camera Interface Development**
   - Create native camera integration
   - Implement photo requirements overlay
   - Add automatic metadata capture
   - Create photo organization system

2. **Offline Photo Storage**
   - Implement local photo storage
   - Create compression algorithms
   - Add thumbnail generation
   - Implement background upload queue

### **Phase 3: Task Management Mobile**
1. **Mobile Task Interface**
   - Create touch-optimized task cards
   - Implement quick action buttons
   - Add voice note capabilities
   - Create offline task updates

2. **Real-time Sync System**
   - Implement background synchronization
   - Create conflict resolution
   - Add retry mechanisms
   - Implement push notifications

### **Phase 4: Integration & Testing**
1. **Cross-Platform Testing**
   - Test on iOS and Android devices
   - Verify offline functionality
   - Test GPS accuracy and battery usage
   - Validate photo upload performance

2. **Performance Optimization**
   - Optimize for mobile bandwidth
   - Implement progressive loading
   - Add caching strategies
   - Minimize battery drain

---

## **✅ Quality Gates for Coordinator**

### **Foundation Approval Requirements:**
- [ ] Mobile interface loads in <3 seconds on 3G
- [ ] GPS location accuracy within 5 meters
- [ ] Camera captures and stores photos offline
- [ ] Task updates sync when connection restored

### **Dependent Tasks Approval Requirements:**
- [ ] 24-hour offline functionality verified
- [ ] Push notifications working across platforms
- [ ] Photo upload success rate >95%
- [ ] Battery usage optimized (<5% per hour)

### **Final Implementation Verification:**
- [ ] Cross-platform compatibility tested
- [ ] Offline-to-online sync accuracy 100%
- [ ] Photo metadata accuracy verified
- [ ] Field worker user acceptance testing passed

---

## **🔗 Dependencies & Integration Points**

### **Required for Foundation Tasks:**
- Subcontractor Access System (Wave 3) - Authentication and permissions
- Database Schema (Wave 1) - User and project data structure
- Task Management System (Wave 2) - Task data and workflows

### **Enables Dependent Systems:**
- Photo Reporting System (Wave 3) - Extends mobile photo capabilities
- Realtime Collaboration (Wave 4) - Mobile real-time updates
- Performance Optimization (Wave 4) - Mobile performance metrics

### **External Integration Requirements:**
- Mobile push notification services (FCM/APNS)
- GPS/location services APIs
- Camera hardware APIs
- Local storage encryption
- Background sync services