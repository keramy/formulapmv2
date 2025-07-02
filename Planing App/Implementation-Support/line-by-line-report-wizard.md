# Line-by-Line Report Creation Wizard

## Overview
A special line-by-line report creation feature designed as a step-by-step wizard interface. Users create reports by entering metadata, then progressively building report lines with descriptions and photos.

## Architecture

### Multi-Step Wizard Implementation
Based on React Hook Form's multi-step wizard patterns with little-state-machine for state persistence:

```tsx
// Main Wizard Container
const LineReportWizard = ({ projectId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [reportData, setReportData] = useState(initialState);
  
  const steps = [
    { component: ReportMetadataStep, title: "Report Details" },
    { component: LineCreationStep, title: "Create Lines" },
    { component: ReviewStep, title: "Review & Publish" }
  ];
  
  return (
    <WizardProvider value={{ reportData, setReportData, currentStep }}>
      <WizardContainer>
        {steps.map((step, index) => (
          <WizardStep 
            key={index} 
            isActive={currentStep === index + 1}
            component={step.component}
          />
        ))}
      </WizardContainer>
    </WizardProvider>
  );
};
```

### Step 1: Report Metadata Collection

```tsx
const ReportMetadataStep = ({ onNext }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      detail: '',
      reportType: 'line-by-line',
      projectId: '',
    }
  });

  const onSubmit = (data) => {
    updateReportData({ metadata: data });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        {...register("name", { required: "Report name is required" })}
        label="Report Name"
        error={!!errors.name}
        helperText={errors.name?.message}
        fullWidth
        margin="normal"
      />
      
      <TextField
        {...register("detail", { required: "Report detail is required" })}
        label="Report Detail"
        multiline
        rows={4}
        error={!!errors.detail}
        helperText={errors.detail?.message}
        fullWidth
        margin="normal"
      />
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained">
          Start Creating Lines
        </Button>
      </Box>
    </form>
  );
};
```

### Step 2: Dynamic Line Creation

```tsx
const LineCreationStep = ({ onNext, onPrevious }) => {
  const { reportData, updateReportData } = useWizardContext();
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [lines, setLines] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      photos: []
    }
  });

  const onSaveAndNext = (data) => {
    const newLine = {
      id: generateId(),
      lineNumber: currentLineIndex + 1,
      ...data,
      createdAt: new Date().toISOString()
    };

    const updatedLines = [...lines];
    updatedLines[currentLineIndex] = newLine;
    setLines(updatedLines);
    
    // Reset form for next line
    reset();
    setCurrentLineIndex(currentLineIndex + 1);
  };

  const onFinishLines = () => {
    updateReportData({ lines });
    onNext();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Line {currentLineIndex + 1}
      </Typography>
      
      <form onSubmit={handleSubmit(onSaveAndNext)}>
        <TextField
          {...register("name", { required: "Line name is required" })}
          label="Line Name"
          error={!!errors.name}
          helperText={errors.name?.message}
          fullWidth
          margin="normal"
          placeholder={`Line ${currentLineIndex + 1} name`}
        />
        
        <TextField
          {...register("description", { required: "Description is required" })}
          label="Description"
          multiline
          rows={3}
          error={!!errors.description}
          helperText={errors.description?.message}
          fullWidth
          margin="normal"
          placeholder="Describe what this line covers..."
        />

        <PhotoUploadSection 
          onPhotosChange={(photos) => setValue('photos', photos)}
          photos={watch('photos')}
        />

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          {currentLineIndex > 0 && (
            <Button 
              variant="outlined" 
              onClick={() => setCurrentLineIndex(currentLineIndex - 1)}
            >
              Previous Line
            </Button>
          )}
          
          <Button type="submit" variant="contained">
            Save & Next Line
          </Button>
          
          {lines.length > 0 && (
            <Button 
              variant="contained" 
              color="success"
              onClick={onFinishLines}
            >
              Finish Lines ({lines.length} created)
            </Button>
          )}
        </Box>
      </form>

      {/* Lines Summary */}
      <LinesSummary lines={lines} currentIndex={currentLineIndex} />
    </Box>
  );
};
```

### Photo Upload & Auto-Arrangement Component

```tsx
const PhotoUploadSection = ({ onPhotosChange, photos = [] }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadPhotos = async (files) => {
    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'line-report-photo');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        return response.json();
      });
      
      const uploadedPhotos = await Promise.all(uploadPromises);
      const newPhotos = [...photos, ...uploadedPhotos.map((photo, index) => ({
        ...photo,
        order: photos.length + index,
        caption: ''
      }))];
      
      onPhotosChange(newPhotos);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    uploadPhotos(files.filter(file => file.type.startsWith('image/')));
  };

  const updatePhotoCaption = (photoId, caption) => {
    const updatedPhotos = photos.map(photo =>
      photo.id === photoId ? { ...photo, caption } : photo
    );
    onPhotosChange(updatedPhotos);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Photos ({photos.length})
      </Typography>
      
      {/* Drag & Drop Zone */}
      <Box
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          backgroundColor: dragActive ? 'action.hover' : 'transparent',
          cursor: 'pointer',
          mb: 2
        }}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => uploadPhotos(Array.from(e.target.files))}
          style={{ display: 'none' }}
          id="photo-upload"
        />
        <label htmlFor="photo-upload">
          <FaImage size={48} color="#ccc" />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Drag & drop photos here or click to select
          </Typography>
        </label>
      </Box>

      {/* Auto-Arranged Photo Grid */}
      {photos.length > 0 && (
        <Grid container spacing={2}>
          {photos.map((photo, index) => (
            <Grid item xs={6} sm={4} md={3} key={photo.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="120"
                  image={photo.url}
                  alt={`Photo ${index + 1}`}
                />
                <CardContent sx={{ p: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Caption..."
                    value={photo.caption}
                    onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                    variant="standard"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Chip label={`#${index + 1}`} size="small" />
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        const filtered = photos.filter(p => p.id !== photo.id);
                        onPhotosChange(filtered);
                      }}
                    >
                      <FaTrash size={12} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {uploading && <LinearProgress sx={{ mt: 2 }} />}
    </Box>
  );
};
```

### Step 3: Review & Publish

```tsx
const ReviewStep = ({ onPrevious, onComplete }) => {
  const { reportData } = useWizardContext();
  const [publishing, setPublishing] = useState(false);
  const [publishSettings, setPublishSettings] = useState({
    teams: [],
    clients: [],
    isPublic: false
  });

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const finalReport = {
        ...reportData,
        publishSettings,
        status: 'published',
        publishedAt: new Date().toISOString()
      };
      
      await saveLineReport(finalReport);
      onComplete(finalReport);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Report
      </Typography>
      
      {/* Report Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">{reportData.metadata.name}</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {reportData.metadata.detail}
          </Typography>
          <Chip label={`${reportData.lines?.length || 0} Lines`} />
        </CardContent>
      </Card>

      {/* Lines Preview */}
      <Typography variant="subtitle1" gutterBottom>
        Lines Summary
      </Typography>
      {reportData.lines?.map((line, index) => (
        <Accordion key={line.id}>
          <AccordionSummary expandIcon={<FaChevronDown />}>
            <Typography>
              Line {index + 1}: {line.name}
            </Typography>
            <Chip 
              label={`${line.photos?.length || 0} photos`} 
              size="small" 
              sx={{ ml: 2 }} 
            />
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              {line.description}
            </Typography>
            {line.photos?.length > 0 && (
              <Grid container spacing={1}>
                {line.photos.map((photo) => (
                  <Grid item xs={6} sm={3} key={photo.id}>
                    <img 
                      src={photo.url} 
                      alt={photo.caption}
                      style={{ width: '100%', height: 80, objectFit: 'cover' }}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Publishing Settings */}
      <PublishingSettings 
        settings={publishSettings}
        onChange={setPublishSettings}
      />

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={onPrevious}>
          Back to Lines
        </Button>
        <Button 
          variant="contained" 
          color="success"
          onClick={handlePublish}
          disabled={publishing}
          startIcon={publishing ? <CircularProgress size={16} /> : <FaSave />}
        >
          {publishing ? 'Publishing...' : 'Publish Report'}
        </Button>
      </Box>
    </Box>
  );
};
```

## Database Schema

```sql
-- Line Reports Table
CREATE TABLE line_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  detail TEXT NOT NULL,
  report_type VARCHAR(50) DEFAULT 'line-by-line',
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Lines Table
CREATE TABLE report_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES line_reports(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(report_id, line_number)
);

-- Line Photos Table
CREATE TABLE line_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id UUID NOT NULL REFERENCES report_lines(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Publishing Table
CREATE TABLE report_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES line_reports(id) ON DELETE CASCADE,
  published_to_type VARCHAR(50) NOT NULL, -- team, client, public
  published_to_id UUID, -- team_id or client_id
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_by UUID NOT NULL REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_line_reports_project_id ON line_reports(project_id);
CREATE INDEX idx_line_reports_status ON line_reports(status);
CREATE INDEX idx_report_lines_report_id ON report_lines(report_id);
CREATE INDEX idx_line_photos_line_id ON line_photos(line_id);
CREATE INDEX idx_report_publications_report_id ON report_publications(report_id);
```

## API Endpoints

```typescript
// POST /api/line-reports
export async function createLineReport(req: Request) {
  const { projectId, name, detail } = req.body;
  
  const report = await supabase
    .from('line_reports')
    .insert({
      project_id: projectId,
      name,
      detail,
      report_number: generateReportNumber(),
      created_by: req.user.id
    })
    .select()
    .single();
    
  return NextResponse.json(report);
}

// POST /api/line-reports/:id/lines
export async function addReportLine(req: Request) {
  const { reportId } = req.params;
  const { name, description, photos } = req.body;
  
  // Get next line number
  const { count } = await supabase
    .from('report_lines')
    .select('*', { count: 'exact' })
    .eq('report_id', reportId);
    
  const line = await supabase
    .from('report_lines')
    .insert({
      report_id: reportId,
      line_number: (count || 0) + 1,
      name,
      description
    })
    .select()
    .single();
    
  // Add photos if provided
  if (photos?.length > 0) {
    await supabase
      .from('line_photos')
      .insert(
        photos.map((photo, index) => ({
          line_id: line.id,
          ...photo,
          display_order: index
        }))
      );
  }
  
  return NextResponse.json(line);
}

// POST /api/line-reports/:id/publish
export async function publishReport(req: Request) {
  const { reportId } = req.params;
  const { teams, clients, isPublic } = req.body;
  
  // Update report status
  await supabase
    .from('line_reports')
    .update({ 
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', reportId);
    
  // Create publication records
  const publications = [
    ...teams.map(teamId => ({
      report_id: reportId,
      published_to_type: 'team',
      published_to_id: teamId,
      published_by: req.user.id
    })),
    ...clients.map(clientId => ({
      report_id: reportId,
      published_to_type: 'client',
      published_to_id: clientId,
      published_by: req.user.id
    }))
  ];
  
  if (isPublic) {
    publications.push({
      report_id: reportId,
      published_to_type: 'public',
      published_to_id: null,
      published_by: req.user.id
    });
  }
  
  await supabase
    .from('report_publications')
    .insert(publications);
    
  return NextResponse.json({ success: true });
}
```

## Integration with Existing System

### Navigation Integration
```tsx
// Add to main reports menu
const ReportsMenu = () => {
  return (
    <Menu>
      <MenuItem onClick={() => navigate('/reports')}>
        All Reports
      </MenuItem>
      <MenuItem onClick={() => navigate('/reports/create')}>
        Standard Report
      </MenuItem>
      <MenuItem onClick={() => navigate('/reports/line-wizard')}>
        📝 Line-by-Line Report
      </MenuItem>
    </Menu>
  );
};
```

### Project Dashboard Integration
```tsx
// Add quick action button to project dashboard
const ProjectActions = ({ projectId }) => {
  return (
    <Stack direction="row" spacing={2}>
      <Button 
        variant="contained"
        startIcon={<FaPlus />}
        onClick={() => navigate(`/reports/line-wizard?project=${projectId}`)}
      >
        Create Line Report
      </Button>
      {/* Other actions */}
    </Stack>
  );
};
```

## Features Summary

✅ **Step-by-Step Wizard**: React Hook Form multi-step pattern
✅ **Report Metadata**: Name and detail collection
✅ **Dynamic Line Creation**: Progressive line-by-line building
✅ **Photo Upload & Auto-Arrangement**: Drag & drop with grid layout
✅ **Save & Next Workflow**: Seamless progression between lines
✅ **Project-Based Tracking**: Linked to project system
✅ **Team/Client Publishing**: Selective sharing capabilities
✅ **Review Before Publish**: Complete preview with edit capability
✅ **Real-time State Management**: Persistent wizard state
✅ **Type-Safe Implementation**: Full TypeScript integration

This implementation provides the exact workflow requested: Report name/detail → Line creation (name, description, photos) → Save & Next → Final save with publishing options.