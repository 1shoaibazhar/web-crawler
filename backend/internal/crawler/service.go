package crawler

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"golang.org/x/net/html"
)

// Service handles web crawling operations
type Service struct {
	client *http.Client
}

// NewService creates a new crawler service
func NewService() *Service {
	return &Service{
		client: &http.Client{
			Timeout: 30 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				// Allow up to 10 redirects
				if len(via) >= 10 {
					return fmt.Errorf("too many redirects")
				}
				return nil
			},
		},
	}
}

// CrawlResult contains all the analysis results from crawling a webpage
type CrawlResult struct {
	HTMLVersion            string
	PageTitle              string
	HeadingCounts          map[string]int
	InternalLinksCount     int
	ExternalLinksCount     int
	InaccessibleLinksCount int
	HasLoginForm           bool
	TotalLinksCount        int
	ResponseTimeMs         int
	PageSizeBytes          int
	Links                  []LinkInfo
}

// LinkInfo contains information about a link found on the page
type LinkInfo struct {
	URL          string
	LinkType     string // "internal" or "external"
	AnchorText   string
	StatusCode   int
	IsAccessible bool
	ResponseTime int
}

// CrawlPage crawls and analyzes a single webpage
func (s *Service) CrawlPage(targetURL string) (*CrawlResult, error) {
	log.Printf("Starting to crawl URL: %s", targetURL)

	startTime := time.Now()

	// Fetch the webpage
	resp, err := s.client.Get(targetURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch page: %v", err)
	}
	defer resp.Body.Close()

	responseTime := int(time.Since(startTime).Milliseconds())

	if resp.StatusCode < 200 || resp.StatusCode >= 400 {
		return nil, fmt.Errorf("received status code %d", resp.StatusCode)
	}

	// Read the response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	pageSize := len(body)
	bodyString := string(body)

	// Parse HTML
	doc, err := html.Parse(strings.NewReader(bodyString))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %v", err)
	}

	// Analyze the page
	result := &CrawlResult{
		HeadingCounts:  make(map[string]int),
		ResponseTimeMs: responseTime,
		PageSizeBytes:  pageSize,
		Links:          []LinkInfo{},
	}

	// Extract HTML version
	result.HTMLVersion = s.extractHTMLVersion(bodyString)

	// Extract page title
	result.PageTitle = s.extractPageTitle(doc)

	// Count heading tags
	s.countHeadings(doc, result.HeadingCounts)

	// Analyze links
	baseURL, _ := url.Parse(targetURL)
	s.analyzeLinks(doc, baseURL, result)

	// Check for login form
	result.HasLoginForm = s.hasLoginForm(doc)

	log.Printf("Crawling completed for %s: %d links found, %d headings",
		targetURL, result.TotalLinksCount, getTotalHeadings(result.HeadingCounts))

	return result, nil
}

// extractHTMLVersion attempts to detect the HTML version from doctype
func (s *Service) extractHTMLVersion(htmlContent string) string {
	content := strings.ToLower(htmlContent)

	if strings.Contains(content, "<!doctype html>") {
		return "HTML5"
	}
	if strings.Contains(content, "html 4.01") {
		if strings.Contains(content, "strict") {
			return "HTML 4.01 Strict"
		} else if strings.Contains(content, "transitional") {
			return "HTML 4.01 Transitional"
		} else if strings.Contains(content, "frameset") {
			return "HTML 4.01 Frameset"
		}
		return "HTML 4.01"
	}
	if strings.Contains(content, "xhtml 1.0") {
		if strings.Contains(content, "strict") {
			return "XHTML 1.0 Strict"
		} else if strings.Contains(content, "transitional") {
			return "XHTML 1.0 Transitional"
		} else if strings.Contains(content, "frameset") {
			return "XHTML 1.0 Frameset"
		}
		return "XHTML 1.0"
	}
	if strings.Contains(content, "xhtml 1.1") {
		return "XHTML 1.1"
	}

	// Default assumption for modern pages
	return "HTML5"
}

// extractPageTitle extracts the page title from HTML
func (s *Service) extractPageTitle(node *html.Node) string {
	if node.Type == html.ElementNode && node.Data == "title" {
		if node.FirstChild != nil && node.FirstChild.Type == html.TextNode {
			return strings.TrimSpace(node.FirstChild.Data)
		}
	}

	for child := node.FirstChild; child != nil; child = child.NextSibling {
		if title := s.extractPageTitle(child); title != "" {
			return title
		}
	}

	return ""
}

// countHeadings counts heading tags (H1-H6) in the HTML
func (s *Service) countHeadings(node *html.Node, counts map[string]int) {
	if node.Type == html.ElementNode {
		switch strings.ToLower(node.Data) {
		case "h1":
			counts["h1"]++
		case "h2":
			counts["h2"]++
		case "h3":
			counts["h3"]++
		case "h4":
			counts["h4"]++
		case "h5":
			counts["h5"]++
		case "h6":
			counts["h6"]++
		}
	}

	for child := node.FirstChild; child != nil; child = child.NextSibling {
		s.countHeadings(child, counts)
	}
}

// analyzeLinks finds and analyzes all links on the page
func (s *Service) analyzeLinks(node *html.Node, baseURL *url.URL, result *CrawlResult) {
	if node.Type == html.ElementNode && node.Data == "a" {
		var href, anchorText string

		// Get href attribute
		for _, attr := range node.Attr {
			if attr.Key == "href" {
				href = attr.Val
				break
			}
		}

		// Get anchor text
		anchorText = s.extractText(node)

		if href != "" {
			linkInfo := s.processLink(href, anchorText, baseURL)
			result.Links = append(result.Links, linkInfo)

			if linkInfo.LinkType == "internal" {
				result.InternalLinksCount++
			} else {
				result.ExternalLinksCount++
			}

			if !linkInfo.IsAccessible {
				result.InaccessibleLinksCount++
			}

			result.TotalLinksCount++
		}
	}

	for child := node.FirstChild; child != nil; child = child.NextSibling {
		s.analyzeLinks(child, baseURL, result)
	}
}

// processLink processes a single link and determines its type and accessibility
func (s *Service) processLink(href, anchorText string, baseURL *url.URL) LinkInfo {
	linkInfo := LinkInfo{
		URL:        href,
		AnchorText: anchorText,
	}

	// Skip certain link types
	if strings.HasPrefix(href, "mailto:") ||
		strings.HasPrefix(href, "tel:") ||
		strings.HasPrefix(href, "javascript:") ||
		strings.HasPrefix(href, "#") {
		linkInfo.LinkType = "internal"
		linkInfo.IsAccessible = true
		return linkInfo
	}

	// Parse the link URL
	linkURL, err := url.Parse(href)
	if err != nil {
		linkInfo.LinkType = "external"
		linkInfo.IsAccessible = false
		return linkInfo
	}

	// Resolve relative URLs
	if !linkURL.IsAbs() {
		linkURL = baseURL.ResolveReference(linkURL)
		linkInfo.URL = linkURL.String()
	}

	// Determine if link is internal or external
	if linkURL.Host == baseURL.Host {
		linkInfo.LinkType = "internal"
	} else {
		linkInfo.LinkType = "external"
	}

	// Check link accessibility (with timeout to avoid hanging)
	linkInfo.IsAccessible, linkInfo.StatusCode, linkInfo.ResponseTime = s.checkLinkAccessibility(linkURL.String())

	return linkInfo
}

// checkLinkAccessibility checks if a link is accessible
func (s *Service) checkLinkAccessibility(linkURL string) (bool, int, int) {
	startTime := time.Now()

	// Create a client with shorter timeout for link checking
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Use HEAD request to check accessibility without downloading content
	resp, err := client.Head(linkURL)
	responseTime := int(time.Since(startTime).Milliseconds())

	if err != nil {
		// If HEAD fails, try GET request
		resp, err = client.Get(linkURL)
		if err != nil {
			return false, 0, responseTime
		}
	}
	defer resp.Body.Close()

	statusCode := resp.StatusCode
	isAccessible := statusCode >= 200 && statusCode < 400

	return isAccessible, statusCode, responseTime
}

// hasLoginForm checks if the page contains a login form
func (s *Service) hasLoginForm(node *html.Node) bool {
	if node.Type == html.ElementNode {
		// Check for form elements
		if node.Data == "form" {
			// Look for password input fields within the form
			if s.hasPasswordField(node) {
				return true
			}
		}

		// Also check for common login-related attributes
		for _, attr := range node.Attr {
			if attr.Key == "class" || attr.Key == "id" {
				value := strings.ToLower(attr.Val)
				if strings.Contains(value, "login") ||
					strings.Contains(value, "signin") ||
					strings.Contains(value, "auth") {
					// If we find login-related classes/IDs, check for password fields
					if s.hasPasswordField(node) {
						return true
					}
				}
			}
		}
	}

	for child := node.FirstChild; child != nil; child = child.NextSibling {
		if s.hasLoginForm(child) {
			return true
		}
	}

	return false
}

// hasPasswordField checks if a node contains a password input field
func (s *Service) hasPasswordField(node *html.Node) bool {
	if node.Type == html.ElementNode && node.Data == "input" {
		for _, attr := range node.Attr {
			if attr.Key == "type" && attr.Val == "password" {
				return true
			}
		}
	}

	for child := node.FirstChild; child != nil; child = child.NextSibling {
		if s.hasPasswordField(child) {
			return true
		}
	}

	return false
}

// extractText extracts text content from an HTML node
func (s *Service) extractText(node *html.Node) string {
	if node.Type == html.TextNode {
		return strings.TrimSpace(node.Data)
	}

	var text string
	for child := node.FirstChild; child != nil; child = child.NextSibling {
		text += s.extractText(child)
	}

	return strings.TrimSpace(text)
}

// getTotalHeadings calculates total heading count
func getTotalHeadings(counts map[string]int) int {
	total := 0
	for _, count := range counts {
		total += count
	}
	return total
}
