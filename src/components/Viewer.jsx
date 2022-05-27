/* global Autodesk */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
const SERVER_URL = process.env.REACT_APP_API_ROUTE;

const AV = Autodesk.Viewing;

const Viewer = (props) => {
  const [urn, setUrn] = useState(
    //   // 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6d3NwX2dlbmVyYWwvJUU1JThGJUIwJUU1JThDJTk3JUU4JUJCJThBJUU3JUFCJTk5JUU4JUJFJUE4JUU1JTg1JUFDJUU1JUFFJUE0LnJ2dA'
    //   'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6d3NwLW1haW4tb2ZmaWNlLyVFNSU4RiVCMCVFNSU4QyU5NyVFOCVCQiU4QSVFNyVBQiU5OSVFOCVCRSVBOCVFNSU4NSVBQyVFNSVBRSVBNC5ydnQ=' //main station
    'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLkxvdXhtNzk0U3dDWGhrcXB1MEZKRVE_dmVyc2lvbj0xMTE' // huanan 111
    // 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6d3NwX2dlbmVyYWwvJUU1JThGJUIwJUU1JThDJTk3JUU4JUJCJThBJUU3JUFCJTk5JUU4JUJFJUE4JUU1JTg1JUFDJUU1JUFFJUE0LnJ2dA=='
  );
  //   const { urn } = useContext(UrnContext);
  const [accessToken, setAccessToken] = useState(null);
  useEffect(() => {
    const getNewToken = async () => {
      const newToken = await axios.get(`${SERVER_URL}/api/forge/getToken`);
      console.log(newToken.data.access_token);
      setAccessToken(newToken.data.access_token);
    };
    getNewToken();
  }, []);

  const viewerRef = useRef(null);
  const viewerDomRef = useRef(null);

  const onModelLoaded = (event) => {
    const viewer = viewerRef.current;

    viewer.removeEventListener(AV.GEOMETRY_LOADED_EVENT, onModelLoaded);

    if (props?.onModelLoaded) {
      props.onModelLoaded(viewer, event);
    }
  };

  const initializeViewer = () => {
    const viewerOptions = {
      accessToken: accessToken,
      env: 'AutodeskProduction2',
      api: 'streamingV2',
    };

    AV.Initializer(viewerOptions, async () => {
      Autodesk.Viewing.Private.InitParametersSetting.alpha = true;
      const viewer = new Autodesk.Viewing.GuiViewer3D(viewerDomRef.current);
      // const viewer = new Autodesk.Viewing.Viewer3D(viewerDomRef.current); //headless view

      viewerRef.current = viewer;

      const startedCode = viewer.start(
        undefined,
        undefined,
        undefined,
        undefined,
        viewerOptions
      );
      if (startedCode > 0) {
        console.error('Failed to create a Viewer: WebGL not supported.');
        return;
      }

      viewer.addEventListener(AV.GEOMETRY_LOADED_EVENT, onModelLoaded, {
        once: true,
      });

      loadModel(viewer, urn);

      if (props?.onViewerInitialized) {
        props.onViewerInitialized(viewer);
      }
    });
  };

  const loadModel = (viewer, documentId) => {
    viewer.impl.renderer().setClearAlpha(0);
    viewer.impl.glrenderer().setClearColor(0xffffff, 0);
    viewer.impl.invalidate(true);
    const onDocumentLoadSuccess = (viewerDocument) => {
      // viewerDocument is an instance of Autodesk.Viewing.Document
      // const defaultModel = viewerDocument.getRoot().getDefaultGeometry(true); // does not load links
      const defaultModel = viewerDocument.getRoot().getDefaultGeometry();
      viewer.loadDocumentNode(viewerDocument, defaultModel, {
        keepCurrentModels: true,
      });

      // since ghosting is heavy, turn off
      viewer?.prefs?.set('ghosting', false);
    };

    const onDocumentLoadFailure = () => {
      console.error('Failed fetching Forge manifest');
    };

    if (documentId) {
      AV.Document.load(
        `urn:${documentId}`,
        onDocumentLoadSuccess,
        onDocumentLoadFailure
      );
    }
  };

  useEffect(() => {
    if (urn) {
      initializeViewer();
    }

    return function cleanUp() {
      if (viewerRef.current) {
        viewerRef.current.finish();
      }
    };
  }, [accessToken, urn]);

  return (
    <>
      <div id='viewerContainer' ref={viewerDomRef}></div>
    </>
  );
};

export default Viewer;
Viewer.displayName = 'Viewer';
