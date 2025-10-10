import { useEffect, useRef, useState } from 'react';

// Extend window type for our global flag
declare global {
  interface Window {
    cornerstoneToolsInitialized?: boolean;
  }
}
// @ts-ignore - Legacy medical imaging libraries without official TypeScript support
import cornerstone from 'cornerstone-core';
// @ts-ignore
import cornerstoneTools from 'cornerstone-tools';
// @ts-ignore
import cornerstoneWebImageLoader from 'cornerstone-web-image-loader';
// @ts-ignore
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
// @ts-ignore
import dicomParser from 'dicom-parser';
// @ts-ignore
import cornerstoneMath from 'cornerstone-math';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move, 
  Ruler, 
  Square, 
  Circle,
  Type,
  Download,
  Maximize2,
  Settings,
  RefreshCw,
  Home,
  Contrast,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Triangle,
  PenTool,
  Target,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  ArrowRight,

  Palette,
  Eye,
  EyeOff,
  ZoomOut as ZoomReset,
  FileText,
  Gauge,
  Link,
  Unlink,
  ScrollText,
  Layers,
  Sun,
  Moon,
  Printer,
  FileImage,
  Trash2,
  Minus,
  Plus,
  Calculator,
  Hash,
  Thermometer,
  Archive,
  FolderDown,
  MousePointer
} from 'lucide-react';

interface DICOMViewerProps {
  imageUrl?: string;  // Made optional for backward compatibility
  imageUrls?: string[];  // New prop for multiple images
  initialImageIndex?: number;  // Starting image index for multi-image mode
  patientInfo?: {
    name: string;
    id: string;
    age: number | string;
    sex: string;
    studyDate?: string;
  };
  onClose?: () => void;
  isDICOM?: boolean;
}

export function DICOMViewer({ imageUrl, imageUrls, initialImageIndex = 0, patientInfo, onClose, isDICOM = false }: DICOMViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTool, setActiveTool] = useState('Wwwc');
  const [imageData, setImageData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [totalFrames, setTotalFrames] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Multi-file support
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  
  // New state for extended functionality
  const [annotationColor, setAnnotationColor] = useState('#ff0000');
  const [annotationOpacity, setAnnotationOpacity] = useState(1);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showDicomTags, setShowDicomTags] = useState(false);
  const [cineSpeed, setCineSpeed] = useState(50);
  const [darkMode, setDarkMode] = useState(false);
  const [syncScroll, setSyncScroll] = useState(false);
  const [syncZoom, setSyncZoom] = useState(false);
  const [syncWindowLevel, setSyncWindowLevel] = useState(false);
  const [viewportsLinked, setViewportsLinked] = useState(false);
  const [isFlippedHorizontal, setIsFlippedHorizontal] = useState(false);
  const [isFlippedVertical, setIsFlippedVertical] = useState(false);
  
  // HU and Angle measurement controls
  const [showHUValues, setShowHUValues] = useState(true);
  const [huPrecision, setHUPrecision] = useState(1); // Decimal places for HU display
  const [anglePrecision, setAnglePrecision] = useState(1); // Decimal places for angle display
  const [angleUnit, setAngleUnit] = useState<'degrees' | 'radians'>('degrees');
  const [huCalibration, setHUCalibration] = useState({ slope: 1, intercept: -1024 }); // Default DICOM calibration
  
  // Mouse tracking for HU display
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentHU, setCurrentHU] = useState<number | null>(null);
  const [showHUOverlay, setShowHUOverlay] = useState(false);
  
  // ZIP export state
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Initialize images array from props
  useEffect(() => {
    if (imageUrls && imageUrls.length > 0) {
      setImages(imageUrls);
      setCurrentImageIndex(Math.min(initialImageIndex, imageUrls.length - 1));
    } else if (imageUrl) {
      setImages([imageUrl]);
      setCurrentImageIndex(0);
    }
  }, [imageUrl, imageUrls, initialImageIndex]);

  useEffect(() => {
    console.log('DICOM Viewer: Starting initialization...');
    
    // Check if cornerstone is properly loaded
    if (!cornerstone || typeof cornerstone.enable !== 'function') {
      console.error('DICOM Viewer: Cornerstone library not properly loaded');
      setError('Medical viewer initialization failed. Please refresh the page.');
      return;
    }

    try {
      // Ensure cornerstone tools is initialized only once globally
      if (!window.cornerstoneToolsInitialized) {
        console.log('DICOM Viewer: Initializing cornerstone libraries...');
        
        // Initialize cornerstone web image loader
        if (cornerstoneWebImageLoader && cornerstoneWebImageLoader.external) {
          cornerstoneWebImageLoader.external.cornerstone = cornerstone;
          if (dicomParser) cornerstoneWebImageLoader.external.dicomParser = dicomParser;
          
          // Configure web image loader with authentication
          try {
            if (cornerstoneWebImageLoader.configure) {
              cornerstoneWebImageLoader.configure({
                beforeSend: function(xhr: XMLHttpRequest, imageId: string) {
                  // Add JWT authentication header for our API endpoints
                  const token = localStorage.getItem('jwtToken');
                  if (token && imageId && (imageId.includes('/api/') || imageId.includes(window.location.origin))) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    console.log('DICOM Viewer: Adding auth header to web image loader request:', imageId);
                  }
                }
              });
              console.log('DICOM Viewer: Web image loader configured successfully');
            }
          } catch (configError) {
            console.warn('DICOM Viewer: Web image loader configuration warning:', configError);
          }
        }
        
        // Initialize WADO image loader for DICOM
        if (cornerstoneWADOImageLoader && cornerstoneWADOImageLoader.external) {
          cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
          if (dicomParser) cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
          
          // Configure WADO loader with error handling
          try {
            cornerstoneWADOImageLoader.configure({
              useWebWorkers: false, // Disable web workers to avoid CORS issues
              beforeSend: function(xhr: XMLHttpRequest, imageId: string) {
                // Add JWT authentication header for our API endpoints
                const token = localStorage.getItem('jwtToken');
                if (token && imageId && (imageId.includes('/api/') || imageId.includes(window.location.origin))) {
                  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                  console.log('DICOM Viewer: Adding auth header to WADO loader request:', imageId);
                }
              }
            });
            console.log('DICOM Viewer: WADO loader configured successfully');
          } catch (configError) {
            console.warn('DICOM Viewer: WADO loader configuration warning:', configError);
          }
        }
        
        // Register image loaders with error handling
        try {
          if (cornerstoneWADOImageLoader?.wadouri?.loadImage) {
            cornerstone.registerImageLoader('wadouri', cornerstoneWADOImageLoader.wadouri.loadImage);
            console.log('DICOM Viewer: WADO image loader registered');
          }
          if (cornerstoneWebImageLoader?.loadImage) {
            // Create a wrapper for the web image loader to add authentication
            const originalWebLoader = cornerstoneWebImageLoader.loadImage;
            const authenticatedWebLoader = (imageId: string) => {
              console.log('DICOM Viewer: Web loader called with imageId:', imageId);
              // Add auth headers through a custom loader
              if (imageId.includes('/api/') || imageId.includes(window.location.origin)) {
                return new Promise((resolve, reject) => {
                  const token = localStorage.getItem('jwtToken');
                  const xhr = new XMLHttpRequest();
                  xhr.open('GET', imageId, true);
                  xhr.responseType = 'arraybuffer';
                  
                  if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    console.log('DICOM Viewer: Added auth header to manual request:', imageId);
                  }
                  
                  xhr.onload = function() {
                    if (xhr.status === 200) {
                      // Convert response to a format cornerstone can use
                      const arrayBuffer = xhr.response;
                      const blob = new Blob([arrayBuffer]);
                      const url = URL.createObjectURL(blob);
                      
                      // Call original loader with blob URL
                      originalWebLoader(url).then(resolve).catch(reject);
                    } else {
                      reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                  };
                  
                  xhr.onerror = function() {
                    reject(new Error('Network error'));
                  };
                  
                  xhr.send();
                });
              } else {
                // Use original loader for external URLs
                return originalWebLoader(imageId);
              }
            };
            
            cornerstone.registerImageLoader('http', authenticatedWebLoader);
            cornerstone.registerImageLoader('https', authenticatedWebLoader);
            console.log('DICOM Viewer: Authenticated web image loaders registered');
          }
        } catch (loaderError) {
          console.warn('DICOM Viewer: Image loader registration warning:', loaderError);
        }
        
        // Initialize cornerstone tools with minimal configuration
        if (cornerstoneTools) {
          cornerstoneTools.external.cornerstone = cornerstone;
          if (cornerstoneMath) cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
          
          try {
            cornerstoneTools.init({
              mouseEnabled: true,
              touchEnabled: false, // Disable touch to avoid pointer events issues
              globalToolSyncEnabled: false,
              showSVGCursors: false, // Disable SVG cursors to avoid rendering issues
            });
            
            // Add tools only once globally - using optional chaining to prevent errors
            if (cornerstoneTools.WwwcTool) cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
            if (cornerstoneTools.PanTool) cornerstoneTools.addTool(cornerstoneTools.PanTool);
            if (cornerstoneTools.ZoomTool) cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
            if (cornerstoneTools.LengthTool) cornerstoneTools.addTool(cornerstoneTools.LengthTool);
            if (cornerstoneTools.AngleTool) cornerstoneTools.addTool(cornerstoneTools.AngleTool);
            if (cornerstoneTools.RectangleRoiTool) cornerstoneTools.addTool(cornerstoneTools.RectangleRoiTool);
            if (cornerstoneTools.EllipticalRoiTool) cornerstoneTools.addTool(cornerstoneTools.EllipticalRoiTool);
            if (cornerstoneTools.ArrowAnnotateTool) cornerstoneTools.addTool(cornerstoneTools.ArrowAnnotateTool);
            if (cornerstoneTools.FreehandRoiTool) cornerstoneTools.addTool(cornerstoneTools.FreehandRoiTool);
            if (cornerstoneTools.ProbeTool) cornerstoneTools.addTool(cornerstoneTools.ProbeTool);
            
            console.log('DICOM Viewer: Available tools:', {
              Wwwc: !!cornerstoneTools.WwwcTool,
              Pan: !!cornerstoneTools.PanTool,
              Zoom: !!cornerstoneTools.ZoomTool,
              Length: !!cornerstoneTools.LengthTool,
              Angle: !!cornerstoneTools.AngleTool,
              RectangleRoi: !!cornerstoneTools.RectangleRoiTool,
              EllipticalRoi: !!cornerstoneTools.EllipticalRoiTool,
              ArrowAnnotate: !!cornerstoneTools.ArrowAnnotateTool,
              FreehandRoi: !!cornerstoneTools.FreehandRoiTool,
              Probe: !!cornerstoneTools.ProbeTool
            });
            
            console.log('DICOM Viewer: Cornerstone tools initialized successfully');
          } catch (toolsError) {
            console.warn('DICOM Viewer: Tools initialization warning:', toolsError);
            // Continue without tools if initialization fails
          }
        }
        
        window.cornerstoneToolsInitialized = true;
        console.log('DICOM Viewer: Global initialization completed');
      }

      // Enable viewport
      if (viewportRef.current && !isInitialized) {
        console.log('DICOM Viewer: Enabling cornerstone viewport');
        cornerstone.enable(viewportRef.current);
        setIsInitialized(true);
        console.log('DICOM Viewer: Viewport enabled successfully');
      }
    } catch (error) {
      console.error('DICOM Viewer: Error initializing cornerstone:', error);
      // Don't set error, try to continue with basic functionality
      console.log('DICOM Viewer: Attempting basic initialization...');
      
      try {
        if (viewportRef.current && !isInitialized) {
          cornerstone.enable(viewportRef.current);
          setIsInitialized(true);
          console.log('DICOM Viewer: Basic viewport enabled');
        }
      } catch (basicError) {
        console.error('DICOM Viewer: Basic initialization also failed:', basicError);
        setError('Failed to initialize medical viewer. Please refresh the page.');
      }
    }

    return () => {
      try {
        if (viewportRef.current && isInitialized) {
          cornerstone.disable(viewportRef.current);
        }
      } catch (error) {
        console.error('DICOM Viewer: Error disabling cornerstone:', error);
      }
    };
  }, [imageUrl]);

  // Separate effect to load image after initialization
  useEffect(() => {
    if (isInitialized && viewportRef.current && images.length > 0) {
      loadImage();
    }
  }, [isInitialized, currentImageIndex, images]);

  // Auto-play slideshow effect
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        if (prevIndex >= images.length - 1) {
          // Loop back to first image or stop playing (user preference)
          return 0; // Loop to start
        }
        return prevIndex + 1;
      });
    }, cineSpeed * 50); // cineSpeed controls the delay (50ms * cineSpeed)
    
    return () => clearInterval(interval);
  }, [isPlaying, images.length, cineSpeed]);

  // Keyboard shortcuts for image navigation
  useEffect(() => {
    if (images.length <= 1) return;
    
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          setCurrentImageIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          setCurrentImageIndex(prev => Math.min(images.length - 1, prev + 1));
          break;
        case 'Home':
          event.preventDefault();
          setCurrentImageIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setCurrentImageIndex(images.length - 1);
          break;
        case ' ':
        case 'Space':
          event.preventDefault();
          setIsPlaying(prev => !prev);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [images.length]);

  const loadImage = async () => {
    if (!viewportRef.current) {
      console.warn('DICOM Viewer: No viewport reference available');
      return;
    }

    // Get current image URL
    const currentImageUrl = images[currentImageIndex];

    // Check if imageUrl is valid
    if (!currentImageUrl || typeof currentImageUrl !== 'string') {
      console.error('DICOM Viewer: Invalid or missing imageUrl:', currentImageUrl);
      setError('No image URL provided');
      setIsLoading(false);
      return;
    }

    console.log('DICOM Viewer: Starting image load', { currentImageUrl, isDICOM, currentImageIndex, totalImages: images.length });
    console.log('DICOM Viewer: Full imageUrl received:', currentImageUrl);
    setIsLoading(true);
    setError(null);

    try {
      let imageId: string;
      
      // Check if this is our API endpoint that needs authentication
      const needsAuth = currentImageUrl.includes('/api/') || currentImageUrl.includes(window.location.origin);
      
      if (needsAuth) {
        console.log('DICOM Viewer: URL needs authentication, loading manually');
        
        // Load the image data manually with authentication
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(currentImageUrl, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`File not found: The image file may have been moved or deleted`);
          } else if (response.status === 401) {
            throw new Error(`Authentication failed: Please log in again`);
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        if (isDICOM) {
          imageId = `wadouri:${blobUrl}`;
          console.log('DICOM Viewer: Loading authenticated DICOM with imageId:', imageId);
        } else {
          imageId = blobUrl;
          console.log('DICOM Viewer: Loading authenticated image with imageId:', imageId);
        }
      } else {
        // External URL - use directly
        if (isDICOM) {
          const fullUrl = currentImageUrl.startsWith('http') ? currentImageUrl : `${window.location.origin}${currentImageUrl}`;
          imageId = `wadouri:${fullUrl}`;
          console.log('DICOM Viewer: Loading external DICOM with imageId:', imageId);
        } else {
          imageId = currentImageUrl.startsWith('http') ? currentImageUrl : `${window.location.origin}${currentImageUrl}`;
          console.log('DICOM Viewer: Loading external image with imageId:', imageId);
        }
      }

      console.log('DICOM Viewer: About to call cornerstone.loadImage with imageId:', imageId);
      const image = await cornerstone.loadImage(imageId);
      console.log('DICOM Viewer: Image loaded successfully', image);
      
      if (!viewportRef.current) {
        console.warn('DICOM Viewer: Viewport lost during image loading');
        setError('Viewport lost during loading');
        setIsLoading(false);
        return;
      }
      
      cornerstone.displayImage(viewportRef.current, image);
      setImageData(image);
      setIsLoading(false);

      // Set up tools
      setupTools();
      console.log('DICOM Viewer: Image display completed successfully');
    } catch (error) {
      console.error('DICOM Viewer: Error loading image:', error);
      
      // Try different loading strategies as fallbacks
      const fallbackStrategies = [];
      
      // Extract the file ID from the URL for alternative endpoints
      const fileIdMatch = currentImageUrl.match(/\/([a-f0-9-]{36})$/i);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;
      
      if (String(error).includes('404') && fileId) {
        // For 404 errors, try alternative endpoints
        fallbackStrategies.push(
          { type: 'objects-uploads', imageId: `${window.location.origin}/api/objects/uploads/${fileId}` },
          { type: 'objects-local-upload', imageId: `${window.location.origin}/api/objects/local-upload/${fileId}` },
          { type: 'files-endpoint', imageId: `${window.location.origin}/api/files/${fileId}` }
        );
        console.log('DICOM Viewer: File not found, trying alternative endpoints');
      }
      
      if (isDICOM) {
        // If DICOM failed, try as regular image
        const regularUrl = currentImageUrl.startsWith('http') ? currentImageUrl : `${window.location.origin}${currentImageUrl}`;
        fallbackStrategies.push({ type: 'regular', imageId: regularUrl });
      } else {
        // If regular image failed, try different URL schemes
        if (!currentImageUrl.startsWith('http')) {
          fallbackStrategies.push({ type: 'absolute', imageId: `${window.location.origin}${currentImageUrl}` });
        }
        // Also try as DICOM if file extension suggests it
        if (currentImageUrl.toLowerCase().includes('.dcm') || currentImageUrl.toLowerCase().includes('.dicom')) {
          const dicomUrl = currentImageUrl.startsWith('http') ? currentImageUrl : `${window.location.origin}${currentImageUrl}`;
          fallbackStrategies.push({ type: 'dicom', imageId: `wadouri:${dicomUrl}` });
        }
      }
      
      // Try fallback strategies
      let fallbackSuccess = false;
      for (const strategy of fallbackStrategies) {
        try {
          console.log(`DICOM Viewer: Trying fallback loading as ${strategy.type} with imageId:`, strategy.imageId);
          if (!viewportRef.current) {
            console.warn('DICOM Viewer: Viewport lost during fallback loading');
            break;
          }
          
          let finalImageId = strategy.imageId;
          
          // If this is an API endpoint, load with authentication
          if (strategy.imageId.includes('/api/') || strategy.imageId.includes(window.location.origin)) {
            const token = localStorage.getItem('jwtToken');
            const response = await fetch(strategy.imageId, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            finalImageId = strategy.type.includes('dicom') ? `wadouri:${blobUrl}` : blobUrl;
          }
          
          const image = await cornerstone.loadImage(finalImageId);
          cornerstone.displayImage(viewportRef.current, image);
          setImageData(image);
          setIsLoading(false);
          setupTools();
          console.log(`DICOM Viewer: Fallback loading successful with ${strategy.type}`);
          fallbackSuccess = true;
          break;
        } catch (fallbackError) {
          console.warn(`DICOM Viewer: Fallback ${strategy.type} failed:`, fallbackError);
        }
      }
      
      if (!fallbackSuccess) {
        console.error('DICOM Viewer: All loading strategies failed');
        const errorMessage = error instanceof Error ? error.message : String(error);
        let userFriendlyMessage;
        
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          userFriendlyMessage = 'Image file not found. The file may have been moved or deleted from storage.';
        } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          userFriendlyMessage = 'Authentication failed. Please log in again.';
        } else if (errorMessage.includes('CORS')) {
          userFriendlyMessage = 'Image access blocked by security policy';
        } else {
          userFriendlyMessage = `Failed to load image: ${errorMessage}`;
        }
        
        setError(userFriendlyMessage);
        setIsLoading(false);
      }
    }
  };

  const setupTools = () => {
    if (!viewportRef.current) {
      console.warn('DICOM Viewer: No viewport available for tools setup');
      return;
    }

    // Check if cornerstoneTools is available
    if (!cornerstoneTools) {
      console.warn('DICOM Viewer: Cornerstone tools not available, skipping tools setup');
      return;
    }

    const element = viewportRef.current;

    try {
      // First add tools to this specific element using tool constructors
      const toolsToAdd = [
        { name: 'Wwwc', tool: cornerstoneTools.WwwcTool },
        { name: 'Pan', tool: cornerstoneTools.PanTool },
        { name: 'Zoom', tool: cornerstoneTools.ZoomTool },
        { name: 'Length', tool: cornerstoneTools.LengthTool },
        { name: 'Angle', tool: cornerstoneTools.AngleTool },
        { name: 'RectangleRoi', tool: cornerstoneTools.RectangleRoiTool },
        { name: 'EllipticalRoi', tool: cornerstoneTools.EllipticalRoiTool },
        { name: 'ArrowAnnotate', tool: cornerstoneTools.ArrowAnnotateTool },
        { name: 'FreehandRoi', tool: cornerstoneTools.FreehandRoiTool },
        { name: 'Probe', tool: cornerstoneTools.ProbeTool }
      ];

      // Add tools to element using addToolForElement with tool constructors
      toolsToAdd.forEach(({ name, tool }) => {
        try {
          if (tool && cornerstoneTools.addToolForElement) {
            cornerstoneTools.addToolForElement(element, tool);
            console.log(`DICOM Viewer: Added ${name} tool to element`);
          }
        } catch (toolError) {
          console.warn(`DICOM Viewer: Failed to add ${name} tool:`, toolError instanceof Error ? toolError.message : String(toolError));
        }
      });

      // Set default tool modes using the correct tool names
      try {
        // Set primary tools active with the tool class names
        if (cornerstoneTools.setToolModeForElement) {
          cornerstoneTools.setToolModeForElement(element, 'WwwcTool', 'active', { mouseButtonMask: 1 });
          cornerstoneTools.setToolModeForElement(element, 'PanTool', 'active', { mouseButtonMask: 2 });
          cornerstoneTools.setToolModeForElement(element, 'ZoomTool', 'active', { mouseButtonMask: 4 });
          
          // Set measurement and annotation tools to passive
          ['LengthTool', 'AngleTool', 'RectangleRoiTool', 'EllipticalRoiTool', 'ArrowAnnotateTool', 'FreehandRoiTool', 'ProbeTool'].forEach(toolName => {
            try {
              cornerstoneTools.setToolModeForElement(element, toolName, 'passive');
            } catch (e) {
              console.debug(`DICOM Viewer: Could not set ${toolName} to passive:`, e instanceof Error ? e.message : String(e));
            }
          });
        } else if (cornerstoneTools.setToolActive) {
          // Try legacy API with simple names
          cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
          cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });
          cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 });
        } else {
          console.warn('DICOM Viewer: No compatible tool setup method found');
          console.log('DICOM Viewer: Available cornerstoneTools methods:', Object.keys(cornerstoneTools));
          return;
        }
        
        console.log('DICOM Viewer: Tool modes set successfully');
      } catch (modeError) {
        console.warn('DICOM Viewer: Error setting tool modes:', modeError);
      }
      
      // Update active tool state
      setActiveTool('Wwwc');
      console.log('DICOM Viewer: Tools setup completed successfully');
    } catch (error) {
      console.warn('DICOM Viewer: Error setting up tools:', error);
      // Continue without tools if setup fails
    }
  };

  const activateTool = (toolName: string) => {
    if (!viewportRef.current) {
      console.warn('DICOM Viewer: No viewport available for tool activation');
      return;
    }

    // Check if cornerstoneTools is available with different API methods
    if (!cornerstoneTools) {
      console.warn('DICOM Viewer: Cornerstone tools not available, skipping tool activation');
      return;
    }

    try {
      const element = viewportRef.current;
      
      // Map UI tool names to actual cornerstone tool names
      const toolNameMap: Record<string, string> = {
        'Wwwc': 'WwwcTool',
        'Pan': 'PanTool', 
        'Zoom': 'ZoomTool',
        'Length': 'LengthTool',
        'Angle': 'AngleTool',
        'RectangleRoi': 'RectangleRoiTool',
        'EllipticalRoi': 'EllipticalRoiTool',
        'ArrowAnnotate': 'ArrowAnnotateTool',
        'FreehandRoi': 'FreehandRoiTool',
        'Probe': 'ProbeTool'
      };

      const actualToolName = toolNameMap[toolName] || toolName;
      const allToolNames = Object.values(toolNameMap);

      // Try different ways to set tool modes
      if (cornerstoneTools.setToolModeForElement) {
        // Deactivate all tools first
        allToolNames.forEach(tool => {
          try {
            cornerstoneTools.setToolModeForElement(element, tool, 'passive');
          } catch (toolError) {
            console.debug('DICOM Viewer: Tool passive warning for', tool, ':', toolError instanceof Error ? toolError.message : String(toolError));
          }
        });

        // Activate selected tool
        cornerstoneTools.setToolModeForElement(element, actualToolName, 'active', { mouseButtonMask: 1 });
        console.log('DICOM Viewer: Tool activated:', actualToolName);
      } else if (cornerstoneTools.setToolActive) {
        // Try legacy API
        cornerstoneTools.setToolPassive(activeTool);
        cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
        console.log('DICOM Viewer: Tool activated (legacy):', toolName);
      } else {
        console.warn('DICOM Viewer: No compatible tool activation method found');
        console.log('DICOM Viewer: Available cornerstoneTools methods:', Object.keys(cornerstoneTools));
        return;
      }
      
      setActiveTool(toolName);
      
      // Add visual feedback that tool is activated
      if (viewportRef.current) {
        viewportRef.current.style.cursor = toolName === 'Pan' ? 'move' : 
                                          toolName === 'Zoom' ? 'zoom-in' :
                                          toolName === 'Length' || toolName === 'Angle' ? 'crosshair' :
                                          'default';
      }
    } catch (error) {
      console.warn('DICOM Viewer: Error activating tool:', error);
    }
  };

  const zoomIn = () => {
    if (!viewportRef.current) return;
    const viewport = cornerstone.getViewport(viewportRef.current);
    viewport.scale += 0.25;
    cornerstone.setViewport(viewportRef.current, viewport);
  };

  const zoomOut = () => {
    if (!viewportRef.current) return;
    const viewport = cornerstone.getViewport(viewportRef.current);
    viewport.scale = Math.max(0.25, viewport.scale - 0.25);
    cornerstone.setViewport(viewportRef.current, viewport);
  };

  const resetView = () => {
    if (!viewportRef.current) return;
    cornerstone.reset(viewportRef.current);
  };

  const rotate = () => {
    if (!viewportRef.current) return;
    const viewport = cornerstone.getViewport(viewportRef.current);
    viewport.rotation += 90;
    cornerstone.setViewport(viewportRef.current, viewport);
  };

  const toggleInvert = () => {
    if (!viewportRef.current) return;
    const viewport = cornerstone.getViewport(viewportRef.current);
    viewport.invert = !viewport.invert;
    cornerstone.setViewport(viewportRef.current, viewport);
  };

  const downloadImage = () => {
    // Use the enhanced export function for consistency
    exportCurrentImageAsPNG();
  };

  // Multi-image navigation functions
  const goToPreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const goToNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const goToFirstImage = () => {
    setCurrentImageIndex(0);
  };

  // HU (Hounsfield Units) calculation functions
  const calculateHU = (pixelValue: number): number => {
    // HU = slope * pixelValue + intercept
    return huCalibration.slope * pixelValue + huCalibration.intercept;
  };

  const formatHUValue = (huValue: number): string => {
    return huPrecision === 0 ? Math.round(huValue).toString() : huValue.toFixed(huPrecision);
  };

  const getHUFromImageCoordinate = (x: number, y: number): number | null => {
    if (!viewportRef.current || !imageData) return null;
    
    try {
      const enabledElement = cornerstone.getEnabledElement(viewportRef.current);
      if (!enabledElement || !enabledElement.image) return null;
      
      // Convert canvas coordinates to image coordinates
      const imagePoint = cornerstone.canvasToPixel(viewportRef.current, { x, y });
      
      // Get pixel data from the image
      const pixelData = enabledElement.image.getPixelData();
      const width = enabledElement.image.width;
      const height = enabledElement.image.height;
      
      const imageX = Math.round(imagePoint.x);
      const imageY = Math.round(imagePoint.y);
      
      // Ensure coordinates are within image bounds
      if (imageX >= 0 && imageX < width && imageY >= 0 && imageY < height) {
        const pixelIndex = imageY * width + imageX;
        const pixelValue = pixelData[pixelIndex];
        return calculateHU(pixelValue);
      }
    } catch (error) {
      console.warn('Error calculating HU value:', error);
    }
    
    return null;
  };

  // Angle measurement helper functions
  const formatAngleValue = (angleRadians: number): string => {
    const angleValue = angleUnit === 'degrees' ? 
      (angleRadians * 180 / Math.PI) : angleRadians;
    
    const formatted = anglePrecision === 0 ? 
      Math.round(angleValue).toString() : angleValue.toFixed(anglePrecision);
    
    return `${formatted}${angleUnit === 'degrees' ? '°' : ' rad'}`;
  };

  // Mouse event handlers for HU display
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!showHUValues || !viewportRef.current) return;
    
    const rect = viewportRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    // Calculate HU value at current mouse position
    const huValue = getHUFromImageCoordinate(x, y);
    setCurrentHU(huValue);
  };

  const handleMouseEnter = () => {
    if (showHUValues) {
      setShowHUOverlay(true);
    }
  };

  const handleMouseLeave = () => {
    setShowHUOverlay(false);
    setCurrentHU(null);
  };

  const goToLastImage = () => {
    setCurrentImageIndex(images.length - 1);
  };

  // New viewport action functions
  const onViewportAction = (action: string) => {
    if (!viewportRef.current) return;
    
    const viewport = cornerstone.getViewport(viewportRef.current);
    
    switch (action) {
      case 'flipHorizontal':
        setIsFlippedHorizontal(!isFlippedHorizontal);
        viewport.hflip = !viewport.hflip;
        break;
      case 'flipVertical':
        setIsFlippedVertical(!isFlippedVertical);
        viewport.vflip = !viewport.vflip;
        break;
      case 'resetOrientation':
        setIsFlippedHorizontal(false);
        setIsFlippedVertical(false);
        viewport.hflip = false;
        viewport.vflip = false;
        viewport.rotation = 0;
        break;
      case 'invertColors':
        viewport.invert = !viewport.invert;
        break;
      case 'zoomReset':
        viewport.scale = 1.0;
        break;
      default:
        console.warn('Unknown viewport action:', action);
        return;
    }
    
    cornerstone.setViewport(viewportRef.current, viewport);
  };

  // Enhanced angle tool with custom event handlers
  const enhanceAngleTool = () => {
    if (!viewportRef.current || !cornerstoneTools.AngleTool) return;
    
    try {
      const element = viewportRef.current;
      
      // Listen for angle measurement completion
      element.addEventListener('cornerstonetoolsmeasurementcompleted', (event: any) => {
        if (event.detail.toolType === 'Angle') {
          const measurement = event.detail;
          if (measurement.angleRadians) {
            console.log(`Angle measurement: ${formatAngleValue(measurement.angleRadians)}`);
          }
        }
      });
      
      // Listen for angle measurement modification
      element.addEventListener('cornerstonetoolsmeasurementmodified', (event: any) => {
        if (event.detail.toolType === 'Angle') {
          const measurement = event.detail;
          if (measurement.angleRadians) {
            console.log(`Angle modified: ${formatAngleValue(measurement.angleRadians)}`);
          }
        }
      });
    } catch (error) {
      console.warn('Error enhancing angle tool:', error);
    }
  };

  // New tool activation function with enhanced features
  const onActivateTool = (toolName: string) => {
    console.log('Activating tool:', toolName);
    
    // Handle special tools
    switch (toolName) {
      case 'deleteAnnotation':
        // Stub implementation - would delete selected annotation
        console.log('Delete annotation tool activated');
        break;
      case 'showDicomTags':
        setShowDicomTags(!showDicomTags);
        break;
      case 'toggleAnnotations':
        setShowAnnotations(!showAnnotations);
        break;
      case 'darkLightMode':
        setDarkMode(!darkMode);
        break;
      case 'Angle':
        // Activate angle tool with enhancements
        activateTool(toolName);
        enhanceAngleTool();
        break;
      default:
        // Use existing activateTool for standard tools
        activateTool(toolName);
    }
  };

  // Sync functions
  const toggleSyncScroll = () => setSyncScroll(!syncScroll);
  const toggleSyncZoom = () => setSyncZoom(!syncZoom);
  const toggleSyncWindowLevel = () => setSyncWindowLevel(!syncWindowLevel);
  const toggleLinkViewports = () => setViewportsLinked(!viewportsLinked);

  // Export functions
  const exportAsPNG = () => {
    if (!viewportRef.current) return;
    const canvas = cornerstone.getEnabledElement(viewportRef.current).canvas;
    const link = document.createElement('a');
    link.download = `dicom-export-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportAsPDF = () => {
    // Stub implementation - would need pdf library
    console.log('Export as PDF - implementation needed');
  };

  const printImage = () => {
    if (!viewportRef.current) return;
    const canvas = cornerstone.getEnabledElement(viewportRef.current).canvas;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>DICOM Image Print</title></head>
          <body style="margin:0; text-align:center;">
            <img src="${canvas.toDataURL()}" style="max-width:100%; max-height:100vh;" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // ZIP Export function for multiple images
  const exportAllImagesToZip = async () => {
    if (images.length === 0) {
      console.warn('No images to export');
      return;
    }

    setIsExportingZip(true);
    setExportProgress(0);

    try {
      // Import JSZip dynamically (you'll need to install it: npm install jszip)
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const totalImages = images.length;
      let processedImages = 0;

      // Process each image
      for (let i = 0; i < images.length; i++) {
        try {
          setExportProgress(Math.round((processedImages / totalImages) * 100));

          // Load image into viewport temporarily if not current
          const originalIndex = currentImageIndex;
          if (i !== currentImageIndex) {
            setCurrentImageIndex(i);
            // Wait for image to load
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Get canvas data
          if (viewportRef.current) {
            const enabledElement = cornerstone.getEnabledElement(viewportRef.current);
            if (enabledElement && enabledElement.canvas) {
              const canvas = enabledElement.canvas;
              
              // Convert canvas to blob
              const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob: Blob | null) => {
                  resolve(blob!);
                }, 'image/png');
              });

              // Add to ZIP with meaningful filename
              const filename = `image_${String(i + 1).padStart(3, '0')}_${patientInfo?.name || 'patient'}.png`;
              zip.file(filename, blob);
            }
          }

          processedImages++;
          
          // Restore original image if we changed it
          if (i !== originalIndex) {
            setCurrentImageIndex(originalIndex);
          }
        } catch (imageError) {
          console.warn(`Failed to export image ${i + 1}:`, imageError);
        }
      }

      // Generate ZIP file
      setExportProgress(95);
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP file
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const patientName = patientInfo?.name ? patientInfo.name.replace(/[^a-zA-Z0-9]/g, '_') : 'unknown';
      link.download = `DICOM_Export_${patientName}_${timestamp}.zip`;
      link.href = URL.createObjectURL(zipBlob);
      link.click();

      // Cleanup
      URL.revokeObjectURL(link.href);
      setExportProgress(100);

      console.log(`Successfully exported ${processedImages} images to ZIP`);
    } catch (error) {
      console.error('Error creating ZIP export:', error);
    } finally {
      setIsExportingZip(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  };

  // Export current image as high-quality PNG
  const exportCurrentImageAsPNG = () => {
    if (!viewportRef.current) return;
    
    try {
      const enabledElement = cornerstone.getEnabledElement(viewportRef.current);
      if (enabledElement && enabledElement.canvas) {
        const canvas = enabledElement.canvas;
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const patientName = patientInfo?.name ? patientInfo.name.replace(/[^a-zA-Z0-9]/g, '_') : 'unknown';
        const imageNum = String(currentImageIndex + 1).padStart(3, '0');
        
        link.download = `DICOM_${patientName}_Image${imageNum}_${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error('Error exporting current image:', error);
    }
  };

  // Check if multi-image navigation should be shown
  const showMultiImageControls = images.length > 1;

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element.requestFullscreen?.() ||
      (element as any).webkitRequestFullscreen?.() ||
      (element as any).msRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() ||
      (document as any).webkitExitFullscreen?.() ||
      (document as any).msExitFullscreen?.();
    }
  };

  return (
    <div className="h-full w-full bg-black text-white overflow-hidden flex flex-col min-h-screen max-h-screen" data-testid="dicom-viewer">
      {/* Compact Top Toolbar - Medical Professional Interface */}
      <div className="bg-gray-900 border-b border-gray-700">
        {/* Main Tool Panels - Horizontal Layout */}
        <TooltipProvider>
          <div className="flex items-center justify-between p-2 space-x-4">
            {/* Left Section: Primary Tools */}
            <div className="flex items-center space-x-4">
              {/* Mouse Functions - Compact */}
              <div className="flex items-center space-x-1 bg-gray-800 rounded px-2 py-1">
                <span className="text-xs text-gray-400 mr-2">Mouse:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={activeTool === 'Zoom' ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onActivateTool('Zoom')}
                    >
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={activeTool === 'Pan' ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onActivateTool('Pan')}
                    >
                      <Move className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Pan</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={activeTool === 'Wwwc' ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onActivateTool('Wwwc')}
                    >
                      <Contrast className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Window/Level</TooltipContent>
                </Tooltip>
              </div>

              {/* Orientation Tools - Compact */}
              <div className="flex items-center space-x-1 bg-gray-800 rounded px-2 py-1">
                <span className="text-xs text-gray-400 mr-2">Orient:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={rotate}
                    >
                      <RotateCw className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rotate</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onViewportAction('flipHorizontal')}
                    >
                      <FlipHorizontal className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Flip H</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onViewportAction('flipVertical')}
                    >
                      <FlipVertical className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Flip V</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onViewportAction('invertColors')}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Invert</TooltipContent>
                </Tooltip>
              </div>

              {/* Annotation Tools - Compact */}
              <div className="flex items-center space-x-1 bg-gray-800 rounded px-2 py-1">
                <span className="text-xs text-gray-400 mr-2">Measure:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={activeTool === 'Length' ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onActivateTool('Length')}
                    >
                      <Ruler className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ruler</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={activeTool === 'Angle' ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onActivateTool('Angle')}
                    >
                      <Triangle className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Angle</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={activeTool === 'RectangleRoi' ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onActivateTool('RectangleRoi')}
                    >
                      <Square className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rectangle ROI</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={activeTool === 'EllipticalRoi' ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onActivateTool('EllipticalRoi')}
                    >
                      <Circle className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ellipse ROI</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={activeTool === 'Probe' ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onActivateTool('Probe')}
                    >
                      <Target className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Pixel Probe</TooltipContent>
                </Tooltip>
              </div>

              {/* Misc Tools - Compact */}
              <div className="flex items-center space-x-1 bg-gray-800 rounded px-2 py-1">
                <span className="text-xs text-gray-400 mr-2">Misc:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={resetView}
                    >
                      <Home className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset View</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => loadImage()}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={() => onActivateTool('darkLightMode')}
                    >
                      {darkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{darkMode ? 'Light' : 'Dark'} Mode</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={toggleFullscreen}
                    >
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Full Screen</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Settings</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={printImage}
                    >
                      <Printer className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
              </div>

              {/* Sync Tools - Compact */}
              <div className="flex items-center space-x-1 bg-gray-800 rounded px-2 py-1">
                <span className="text-xs text-gray-400 mr-2">Sync:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={syncScroll ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={toggleSyncScroll}
                    >
                      <MousePointer className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sync Scroll</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={syncZoom ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={toggleSyncZoom}
                    >
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sync Zoom</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={syncWindowLevel ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={toggleSyncWindowLevel}
                    >
                      <Contrast className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sync W/L</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={viewportsLinked ? 'default' : 'ghost'}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      onClick={toggleLinkViewports}
                    >
                      {viewportsLinked ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Link Viewports</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Center Section: Patient Info Compact */}
            <div className="flex items-center space-x-3 text-xs">
              {patientInfo && (
                <>
                  <div className="bg-blue-900/50 px-2 py-1 rounded">
                    <span className="text-blue-200 font-medium">{patientInfo.name}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300">{patientInfo.age}Y {patientInfo.sex.toUpperCase()}</span>
                  <span className="text-gray-400">•</span>
                  <Badge variant="secondary" className="bg-blue-700 text-blue-100 text-xs">
                    {isDICOM ? 'DICOM' : 'IMAGE'}
                  </Badge>
                </>
              )}
            </div>

            {/* Right Section: Navigation & Export */}
            <div className="flex items-center space-x-4">
              {/* Enhanced Image Navigation Panel - Compact */}
              {showMultiImageControls && (
                <div className="flex items-center space-x-1 bg-gray-800 rounded px-2 py-1">
                  <span className="text-xs text-gray-400 mr-2">Images:</span>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={goToFirstImage}
                        disabled={currentImageIndex === 0}
                        className="h-6 w-6 p-0 text-white hover:bg-gray-700 disabled:opacity-50"
                      >
                        <SkipBack className="w-3 h-3" />
                        <SkipBack className="w-3 h-3 -ml-1.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>First Image</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={goToPreviousImage}
                        disabled={currentImageIndex === 0}
                        className="h-6 w-6 p-0 text-white hover:bg-gray-700 disabled:opacity-50"
                      >
                        <SkipBack className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Previous Image</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant={isPlaying ? 'default' : 'ghost'}
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isPlaying ? 'Pause' : 'Play'} Slideshow</TooltipContent>
                  </Tooltip>
                  
                  <span className="text-xs text-gray-400 px-2 min-w-16 text-center">
                    {currentImageIndex + 1} / {images.length}
                  </span>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={goToNextImage}
                        disabled={currentImageIndex === images.length - 1}
                        className="h-6 w-6 p-0 text-white hover:bg-gray-700 disabled:opacity-50"
                      >
                        <SkipForward className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Next Image</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={goToLastImage}
                        disabled={currentImageIndex === images.length - 1}
                        className="h-6 w-6 p-0 text-white hover:bg-gray-700 disabled:opacity-50"
                      >
                        <SkipForward className="w-3 h-3" />
                        <SkipForward className="w-3 h-3 -ml-1.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Last Image</TooltipContent>
                  </Tooltip>
                  
                  {/* Cine Speed Control - Only show when playing */}
                  {isPlaying && (
                    <>
                      <div className="w-px h-4 bg-gray-600 mx-1" />
                      <span className="text-xs text-gray-500">Speed:</span>
                      <div className="flex items-center space-x-1 w-16">
                        <Slider
                          value={[cineSpeed]}
                          onValueChange={(values) => setCineSpeed(values[0])}
                          max={100}
                          min={10}
                          step={10}
                          className="flex-1"
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-6">{cineSpeed}%</span>
                    </>
                  )}
                </div>
              )}

              {/* Export Tools - Compact */}
              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={exportCurrentImageAsPNG}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download Image</TooltipContent>
                </Tooltip>

                {images.length > 1 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={exportAllImagesToZip}
                        disabled={isExportingZip}
                        className="h-6 w-6 p-0 text-white hover:bg-gray-700 relative"
                      >
                        {isExportingZip ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Archive className="w-3 h-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export All to ZIP</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={resetView}
                      className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                    >
                      <Home className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset View</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* DICOM Tags Panel - Show when enabled as overlay */}
        {showDicomTags && (
          <div className="absolute top-20 left-4 bg-gray-900 border border-gray-700 rounded p-4 z-30 max-w-sm">
            <h4 className="text-xs font-medium text-gray-400 mb-2">DICOM Tags</h4>
            <div className="text-xs text-gray-300 space-y-1">
              <div>Patient: {patientInfo?.name || 'N/A'}</div>
              <div>Study Date: {patientInfo?.studyDate || 'N/A'}</div>
              {imageData && (
                <>
                  <div>Image Size: {imageData.width}x{imageData.height}</div>
                  <div>Pixel Data: {imageData.color ? 'RGB' : 'Grayscale'}</div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Main Viewer Area - Full Width */}
        <div className="flex-1 flex flex-col">

          {/* Image Viewport */}
          <div className="flex-1 flex items-center justify-center bg-black relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
                <div className="flex flex-col items-center space-y-3 text-white">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading image...</span>
                </div>
              </div>
            )}
            
            {error && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
                <div className="flex flex-col items-center space-y-3 text-white max-w-md text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                    <span className="text-xl">⚠</span>
                  </div>
                  <h3 className="font-medium">Failed to Load Image</h3>
                  <p className="text-sm text-gray-300">{error}</p>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-left bg-gray-900 p-2 rounded max-w-full overflow-auto">
                      <div><strong>Debug Info:</strong></div>
                      <div>URL: {imageUrl}</div>
                      <div>Is DICOM: {isDICOM ? 'Yes' : 'No'}</div>
                      <div>Cornerstone Available: {typeof cornerstone !== 'undefined' ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => loadImage()}
                    className="text-white border-white hover:bg-white hover:text-black"
                    data-testid="button-retry-image"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            <div
              ref={viewportRef}
              className="w-full h-full bg-black cursor-crosshair relative"
              style={{ minHeight: '300px', minWidth: '300px' }}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              data-testid="image-viewport"
            />
            
            {/* HU Value Overlay */}
            {showHUOverlay && currentHU !== null && showHUValues && (
              <div
                className="absolute pointer-events-none bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs z-20 border border-blue-400"
                style={{
                  left: `${mousePosition.x + 10}px`,
                  top: `${mousePosition.y - 30}px`,
                }}
              >
                <div className="flex items-center space-x-1">
                  <Calculator className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-400 font-medium">HU:</span>
                  <span className="font-mono">{formatHUValue(currentHU)}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  x: {Math.round(mousePosition.x)}, y: {Math.round(mousePosition.y)}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Status Bar */}
          <div className="bg-gray-800 p-2 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <span>Active Tool: {activeTool}</span>
                {imageData && (
                  <>
                    <span>Size: {imageData.width} x {imageData.height}</span>
                    <span>Bits: {imageData.color ? '24' : '8'}</span>
                  </>
                )}
                {showHUValues && currentHU !== null && (
                  <div className="flex items-center space-x-1 text-blue-400">
                    <Calculator className="w-3 h-3" />
                    <span>HU: {formatHUValue(currentHU)}</span>
                  </div>
                )}
                {mousePosition && (
                  <span>Cursor: ({Math.round(mousePosition.x)}, {Math.round(mousePosition.y)})</span>
                )}
                {images.length > 1 && (
                  <div className="flex items-center space-x-1 text-purple-400">
                    <Archive className="w-3 h-3" />
                    <span>{images.length} Images</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {angleUnit === 'degrees' ? (
                  <span className="text-green-400">Angles: Degrees (°)</span>
                ) : (
                  <span className="text-green-400">Angles: Radians</span>
                )}
                {isExportingZip && (
                  <div className="flex items-center space-x-1 text-orange-400">
                    <FolderDown className="w-3 h-3" />
                    <span>Exporting ZIP... {exportProgress}%</span>
                  </div>
                )}
                <span>{isLoading ? 'Loading...' : error ? 'Error' : 'Ready'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}