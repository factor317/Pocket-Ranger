import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Search, RefreshCw } from 'lucide-react-native';

interface TextNodeIssue {
  id: string;
  type: 'direct-text' | 'conditional-string' | 'variable-string' | 'whitespace' | 'array-string';
  element: Element | null;
  textContent: string;
  parentElement: string;
  xpath: string;
  severity: 'error' | 'warning';
  timestamp: number;
}

interface RealTextNodeValidatorProps {
  children: React.ReactNode;
  enabled?: boolean;
  autoScan?: boolean;
}

export default function RealTextNodeValidator({ 
  children, 
  enabled = true, 
  autoScan = true 
}: RealTextNodeValidatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [issues, setIssues] = useState<TextNodeIssue[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const scanInterval = useRef<NodeJS.Timeout>();
  const containerRef = useRef<View>(null);

  // Real DOM scanning function
  const scanForTextNodes = () => {
    if (typeof document === 'undefined') {
      console.warn('RealTextNodeValidator: DOM not available (running on native?)');
      return;
    }

    setIsScanning(true);
    const foundIssues: TextNodeIssue[] = [];

    try {
      // Get all elements in the document
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach((element, index) => {
        // Check for direct text nodes that aren't in Text components
        const textNodes = Array.from(element.childNodes).filter(
          node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
        );

        textNodes.forEach((textNode) => {
          const textContent = textNode.textContent?.trim() || '';
          
          // Skip if empty or just whitespace
          if (!textContent) return;
          
          // Check if parent is a View-like element (div with React Native classes)
          const parentElement = textNode.parentElement;
          if (!parentElement) return;

          const parentClasses = parentElement.className || '';
          const isViewLike = parentClasses.includes('css-view') || 
                           parentClasses.includes('r-flex') ||
                           parentElement.tagName === 'DIV';
          
          // Check if it's NOT in a Text component
          const isInTextComponent = parentClasses.includes('css-text') ||
                                  parentElement.tagName === 'SPAN' ||
                                  parentElement.getAttribute('dir') === 'auto';

          if (isViewLike && !isInTextComponent && textContent.length > 0) {
            const xpath = getXPath(textNode);
            
            foundIssues.push({
              id: `${Date.now()}-${index}-${Math.random()}`,
              type: 'direct-text',
              element: parentElement,
              textContent: textContent.substring(0, 100), // Limit length
              parentElement: `${parentElement.tagName}.${parentClasses.split(' ').slice(0, 2).join('.')}`,
              xpath,
              severity: 'error',
              timestamp: Date.now()
            });
          }
        });

        // Check for potential conditional rendering issues
        const elementText = element.textContent?.trim();
        if (elementText && (
          elementText === 'true' || 
          elementText === 'false' || 
          elementText === '0' ||
          /^\d+$/.test(elementText)
        )) {
          const parentClasses = element.className || '';
          const isViewLike = parentClasses.includes('css-view');
          
          if (isViewLike) {
            foundIssues.push({
              id: `${Date.now()}-cond-${index}`,
              type: 'conditional-string',
              element: element as Element,
              textContent: elementText,
              parentElement: `${element.tagName}.${parentClasses.split(' ').slice(0, 2).join('.')}`,
              xpath: getXPath(element),
              severity: 'warning',
              timestamp: Date.now()
            });
          }
        }

        // Check for suspicious whitespace
        if (element.childNodes.length === 1 && 
            element.firstChild?.nodeType === Node.TEXT_NODE &&
            /^\s+$/.test(element.firstChild.textContent || '')) {
          
          const parentClasses = element.className || '';
          const isViewLike = parentClasses.includes('css-view');
          
          if (isViewLike) {
            foundIssues.push({
              id: `${Date.now()}-ws-${index}`,
              type: 'whitespace',
              element: element as Element,
              textContent: '[whitespace]',
              parentElement: `${element.tagName}.${parentClasses.split(' ').slice(0, 2).join('.')}`,
              xpath: getXPath(element),
              severity: 'warning',
              timestamp: Date.now()
            });
          }
        }
      });

      // Also check for React error boundaries or error messages
      const errorElements = document.querySelectorAll('[data-reactroot] *');
      errorElements.forEach((element) => {
        const text = element.textContent || '';
        if (text.includes('text node') || 
            text.includes('cannot be a child of') ||
            text.includes('Unexpected text node')) {
          
          foundIssues.push({
            id: `${Date.now()}-error-${Math.random()}`,
            type: 'direct-text',
            element: element as Element,
            textContent: text.substring(0, 200),
            parentElement: 'ERROR_BOUNDARY',
            xpath: getXPath(element),
            severity: 'error',
            timestamp: Date.now()
          });
        }
      });

    } catch (error) {
      console.error('Error scanning for text nodes:', error);
    }

    setIssues(foundIssues);
    setScanCount(prev => prev + 1);
    setIsScanning(false);
  };

  // Generate XPath for an element
  const getXPath = (element: Node): string => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return 'unknown';
    }
    
    const el = element as Element;
    const parts: string[] = [];
    let current: Element | null = el;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        parts.unshift(selector);
        break;
      }
      
      if (current.className) {
        const classes = current.className.split(' ').slice(0, 2).join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }
      
      parts.unshift(selector);
      current = current.parentElement;
      
      // Limit depth to prevent very long XPaths
      if (parts.length > 5) break;
    }
    
    return parts.join(' > ');
  };

  // Highlight element in DOM
  const highlightElement = (issue: TextNodeIssue) => {
    if (!issue.element) return;
    
    // Remove previous highlights
    document.querySelectorAll('.text-node-highlight').forEach(el => {
      el.classList.remove('text-node-highlight');
    });
    
    // Add highlight to current element
    issue.element.classList.add('text-node-highlight');
    
    // Scroll to element
    issue.element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      issue.element?.classList.remove('text-node-highlight');
    }, 3000);
  };

  // Auto-scan setup
  useEffect(() => {
    if (!enabled || !autoScan) return;

    // Initial scan
    setTimeout(scanForTextNodes, 1000);

    // Set up periodic scanning
    scanInterval.current = setInterval(scanForTextNodes, 5000);

    return () => {
      if (scanInterval.current) {
        clearInterval(scanInterval.current);
      }
    };
  }, [enabled, autoScan]);

  // Add CSS for highlighting
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
      .text-node-highlight {
        outline: 3px solid #dc2626 !important;
        outline-offset: 2px !important;
        background-color: rgba(220, 38, 38, 0.1) !important;
        animation: pulse-highlight 1s ease-in-out infinite alternate;
      }
      
      @keyframes pulse-highlight {
        from { outline-color: #dc2626; }
        to { outline-color: #f87171; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!enabled) {
    return <>{children}</>;
  }

  const errorIssues = issues.filter(issue => issue.severity === 'error');
  const warningIssues = issues.filter(issue => issue.severity === 'warning');

  return (
    <View style={styles.container} ref={containerRef}>
      {children}
      
      {/* Floating Button */}
      <TouchableOpacity
        style={[styles.floatingButton, isVisible && styles.floatingButtonActive]}
        onPress={() => setIsVisible(!isVisible)}
      >
        {isVisible ? <EyeOff size={20} color="#ffffff" /> : <Eye size={20} color="#ffffff" />}
        {issues.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{issues.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Validation Overlay */}
      {isVisible && (
        <View style={styles.overlay}>
          <SafeAreaView style={styles.overlayContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Search size={20} color="#0e1a13" />
                <Text style={styles.title}>Real Text Node Scanner</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity 
                  style={styles.scanButton}
                  onPress={scanForTextNodes}
                  disabled={isScanning}
                >
                  <RefreshCw size={16} color="#ffffff" />
                  <Text style={styles.scanButtonText}>
                    {isScanning ? 'Scanning...' : 'Scan Now'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsVisible(false)}>
                  <EyeOff size={20} color="#51946c" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Status */}
            <View style={styles.status}>
              <View style={[styles.statusIndicator, { 
                backgroundColor: isScanning ? '#f59e0b' : (issues.length > 0 ? '#dc2626' : '#10b981')
              }]} />
              <Text style={styles.statusText}>
                {isScanning ? 'Scanning DOM...' : `${issues.length} text node issues found`}
              </Text>
              <Text style={styles.statusCount}>
                Scan #{scanCount}
              </Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Summary */}
              <View style={styles.summary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{errorIssues.length}</Text>
                  <Text style={styles.summaryLabel}>Errors</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{warningIssues.length}</Text>
                  <Text style={styles.summaryLabel}>Warnings</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{scanCount}</Text>
                  <Text style={styles.summaryLabel}>Scans</Text>
                </View>
              </View>

              {/* Issues List */}
              {issues.length === 0 ? (
                <View style={styles.emptyState}>
                  <CheckCircle size={32} color="#10b981" />
                  <Text style={styles.emptyText}>No text node issues detected!</Text>
                  <Text style={styles.emptySubtext}>
                    Your components are properly structured.
                  </Text>
                </View>
              ) : (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Live Issues ({issues.length})
                  </Text>
                  
                  {issues.map(issue => (
                    <TouchableOpacity
                      key={issue.id}
                      style={[styles.issueCard, {
                        backgroundColor: issue.severity === 'error' ? '#fef2f2' : '#fffbeb',
                        borderLeftColor: issue.severity === 'error' ? '#dc2626' : '#f59e0b'
                      }]}
                      onPress={() => highlightElement(issue)}
                    >
                      <View style={styles.issueHeader}>
                        <View style={styles.issueInfo}>
                          <Text style={styles.issueType}>
                            {issue.type.replace('-', ' ').toUpperCase()}
                          </Text>
                          <Text style={styles.issueParent}>{issue.parentElement}</Text>
                        </View>
                        {issue.severity === 'error' ? 
                          <AlertTriangle size={16} color="#dc2626" /> :
                          <AlertTriangle size={16} color="#f59e0b" />
                        }
                      </View>
                      
                      <Text style={styles.issueContent} numberOfLines={2}>
                        "{issue.textContent}"
                      </Text>
                      
                      <Text style={styles.issueXPath} numberOfLines={1}>
                        {issue.xpath}
                      </Text>
                      
                      <Text style={styles.issueTime}>
                        {new Date(issue.timestamp).toLocaleTimeString()}
                      </Text>
                      
                      <Text style={styles.tapHint}>Tap to highlight in DOM</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Real-time Info */}
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>🔍 Real DOM Analysis</Text>
                <Text style={styles.infoText}>
                  This validator scans your actual DOM for text nodes that aren't properly wrapped in Text components. 
                  It finds the REAL issues causing your "Unexpected text node" errors.
                </Text>
                <Text style={styles.infoText}>
                  • Scans every 5 seconds automatically{'\n'}
                  • Highlights problematic elements when tapped{'\n'}
                  • Shows exact DOM structure and XPath{'\n'}
                  • Detects conditional rendering issues
                </Text>
              </View>

              {/* Quick Fixes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Fixes</Text>
                
                <View style={styles.fixCard}>
                  <Text style={styles.fixTitle}>🔧 Direct Text Fix</Text>
                  <Text style={styles.fixDescription}>
                    Wrap any direct text in {'<Text>'} components:
                  </Text>
                  <View style={styles.codeExample}>
                    <Text style={styles.codeText}>
                      {'// Before: <View>Hello</View>\n// After:  <View><Text>Hello</Text></View>'}
                    </Text>
                  </View>
                </View>

                <View style={styles.fixCard}>
                  <Text style={styles.fixTitle}>⚡ Conditional Text Fix</Text>
                  <Text style={styles.fixDescription}>
                    Wrap conditional strings in Text components:
                  </Text>
                  <View style={styles.codeExample}>
                    <Text style={styles.codeText}>
                      {'// Before: {condition && "text"}\n// After:  {condition && <Text>text</Text>}'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  floatingButtonActive: {
    backgroundColor: '#0e1a13',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 999,
  },
  overlayContent: {
    flex: 1,
    backgroundColor: '#f8fbfa',
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f2ec',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0e1a13',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f2ec',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#0e1a13',
    flex: 1,
  },
  statusCount: {
    fontSize: 12,
    color: '#51946c',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0e1a13',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#51946c',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0e1a13',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#51946c',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 12,
  },
  issueCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  issueInfo: {
    flex: 1,
  },
  issueType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0e1a13',
  },
  issueParent: {
    fontSize: 11,
    color: '#51946c',
    marginTop: 2,
  },
  issueContent: {
    fontSize: 14,
    color: '#0e1a13',
    marginBottom: 4,
    fontFamily: 'monospace',
    backgroundColor: '#f1f4f2',
    padding: 4,
    borderRadius: 4,
  },
  issueXPath: {
    fontSize: 11,
    color: '#51946c',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  issueTime: {
    fontSize: 10,
    color: '#51946c',
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 10,
    color: '#dc2626',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#7dd3fc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#0c4a6e',
    lineHeight: 18,
    marginBottom: 8,
  },
  fixCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  fixTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 8,
  },
  fixDescription: {
    fontSize: 13,
    color: '#51946c',
    marginBottom: 8,
  },
  codeExample: {
    backgroundColor: '#f1f4f2',
    padding: 8,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#0e1a13',
  },
});