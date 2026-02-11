import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface StoryData {
    type: 'daily' | 'challenge' | 'league' | 'milestone';
    steps?: number;
    distance?: number;
    time?: string;
    league?: string;
    rank?: number;
    challengeName?: string;
    userPhoto?: string;
    userName: string;
    date?: string;
    // New fields for templates
    timeOfDay?: string; // "Morning", "Afternoon", etc.
    weatherTemp?: string; // "74°F"
    weatherDesc?: string; // "overcast clouds"
}

interface TemplateProps {
    data: StoryData;
    backgroundImage?: string | null;
}

export default function StoryTemplateGenerator({ userStats }: { userStats: any }) {
    const [visible, setVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
    const [cameraType, setCameraType] = useState<CameraType>('back');
    const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const [permission, requestPermission] = useCameraPermissions();
    const [libraryPermission, requestLibraryPermission] = MediaLibrary.usePermissions();

    // We need TWO refs: one to control the camera, one to capture the screenshot
    const cameraRef = useRef<CameraView>(null);
    const viewShotRef = useRef<ViewShot>(null);

    const templates = [
        { id: 1, name: 'Day', icon: 'calendar-outline' },
        { id: 2, name: 'Date', icon: 'today-outline' },
        { id: 3, name: 'Morning', icon: 'sunny-outline' },
        { id: 4, name: 'Vibes', icon: 'leaf-outline' },
        { id: 5, name: 'Progress', icon: 'trending-up-outline' },
        { id: 6, name: 'Energy', icon: 'flash' },
        { id: 7, name: 'Sport', icon: 'basketball-outline' },
        { id: 8, name: 'Active', icon: 'bicycle-outline' },
        { id: 9, name: 'Walk', icon: 'walk-outline' },
        { id: 10, name: 'Ride', icon: 'bicycle' },
    ];

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission();
        }
        if (visible && !libraryPermission?.granted) {
            requestLibraryPermission();
        }
    }, [visible]);

    const toggleCameraType = () => {
        setCameraType(current => (current === 'back' ? 'front' : 'back'));
    };

    const toggleFlash = () => {
        setFlashMode(current => (current === 'off' ? 'on' : 'off'));
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 1,
        });

        if (!result.canceled) {
            setCapturedImage(result.assets[0].uri);
        }
    };

    // The robust capture flow:
    const handleShutterPress = async () => {
        if (isCapturing) return;

        try {
            setIsCapturing(true);

            // Step 1: If using camera (not using gradient template logic), take photo
            // Note: Use gradient logic if we had a non-camera template, but all new ones work well with camera
            if (!capturedImage && cameraRef.current) {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 1,
                    skipProcessing: true, // faster
                });

                // Step 2: Show the captured photo
                if (photo?.uri) {
                    setCapturedImage(photo.uri);

                    // Step 3: Wait briefly for re-render
                    setTimeout(() => {
                        captureViewShotAndShare();
                    }, 500); // 500ms delay to ensure image is rendered
                } else {
                    setIsCapturing(false);
                    Alert.alert('Error', 'Could not take photo');
                }
            } else {
                // Already have an image
                captureViewShotAndShare();
            }

        } catch (error) {
            console.error('Shutter error:', error);
            setIsCapturing(false);
            Alert.alert('Error', 'Failed to capture photo');
        }
    };

    const captureViewShotAndShare = async () => {
        try {
            if (!viewShotRef.current?.capture) {
                setIsCapturing(false);
                return;
            }

            // Step 4: Capture the comprised View (Image + Overlay)
            const uri = await viewShotRef.current.capture();

            // Step 5: Share immediately
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share to Instagram Story',
                });
            } else {
                Alert.alert('Saved', 'Image saved to gallery (Sharing not available)');
                if (libraryPermission?.granted) {
                    await MediaLibrary.saveToLibraryAsync(uri);
                }
            }
        } catch (error) {
            console.error('Sharing error:', error);
            Alert.alert('Error', 'Failed to share image');
        } finally {
            setIsCapturing(false);
        }
    };

    const resetCapture = () => {
        setCapturedImage(null);
        setIsCapturing(false);
    };

    const renderTemplate = () => {
        const now = new Date();
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

        const data: StoryData = {
            type: 'daily',
            steps: userStats?.steps || 0,
            distance: userStats?.distance || 0,
            league: userStats?.league || 'Gold',
            rank: userStats?.rank || 1,
            userName: userStats?.name || 'User',
            date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };

        const bgImage = capturedImage;
        const currentDay = days[now.getDay()];
        const currentMonth = months[now.getMonth()];
        const currentDate = now.getDate();
        const currentYear = now.getFullYear();

        switch (selectedTemplate) {
            case 1: // WEDNESDAY style
                return (
                    <View style={templateStyles.fullScreen}>
                        <View style={{ marginTop: 'auto', marginBottom: 60 }}>
                            <Text style={templateStyles.t1MonthYear}>{currentMonth} {currentYear}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <Text style={templateStyles.t1SmallText}>MADE WITH STORIES_</Text>
                                <Text style={[templateStyles.t1SmallText, { marginLeft: 20 }]}>{now.getHours()} PM</Text>
                            </View>
                            <Text style={templateStyles.t1Day}>{currentDay}</Text>
                            <Text style={templateStyles.t1Quote}>
                                KOLEKSI SUASANA ASYIK{'\n'}
                                PERASAAN-PRASAAN YANG BAIK{'\n'}
                                CINTANYA BESAR-BESARAN
                            </Text>
                            <View style={{ marginTop: 30 }}>
                                <Text style={templateStyles.t1Footer}>STORIES BY {data.userName.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                );
            case 2: // 29 Monday Morning
                return (
                    <View style={templateStyles.fullScreen}>
                        <View style={{ marginTop: 'auto', marginBottom: 80, alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <Text style={templateStyles.t2Date}>{currentDate}</Text>
                                <View style={{ marginLeft: 20, paddingTop: 10 }}>
                                    <Text style={templateStyles.t2Day}>{currentDay}</Text>
                                    <Text style={templateStyles.t2Day}>Morning</Text>
                                </View>
                            </View>
                            <Text style={templateStyles.t2Dots}>...</Text>
                            <Text style={templateStyles.t2Weather}>Weather today overcast clouds with{'\n'}temperature 74°F.</Text>
                            <View style={templateStyles.t2Line} />
                            <Text style={templateStyles.t2Footer}>Instastory by {data.userName}</Text>
                        </View>
                    </View>
                );
            case 3: // GOOD MORNING EVERYONE
                return (
                    <View style={templateStyles.fullScreen}>
                        <View style={{ marginTop: 150, alignItems: 'center' }}>
                            <Text style={templateStyles.t3copyright}>©2026|{data.userName.toLowerCase()}_</Text>
                            <Text style={templateStyles.t3Title}>GOOD</Text>
                            <Text style={templateStyles.t3Title}>MORNING</Text>
                            <Text style={templateStyles.t3Subtitle}>EVERYONE</Text>

                            <View style={templateStyles.t3TimeRow}>
                                <Text style={templateStyles.t3Time}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.')}</Text>
                                <View style={templateStyles.t3Divider} />
                                <Text style={templateStyles.t3Day}>{currentDay}</Text>
                            </View>
                            <Text style={templateStyles.t3Message}>have a nice day</Text>
                        </View>
                    </View>
                );
            case 4: // Morning Vibes
                return (
                    <View style={templateStyles.fullScreen}>
                        <View style={{ marginTop: 'auto', marginBottom: 80, paddingLeft: 20 }}>
                            <View style={templateStyles.t4DateTag}>
                                <Text style={templateStyles.t4DateText}>{currentDate} {currentMonth.substring(0, 3)} {currentYear}</Text>
                            </View>
                            <Text style={templateStyles.t4Title}>Morning</Text>
                            <Text style={templateStyles.t4Title}>Vibes.</Text>
                            <Text style={templateStyles.t4Description}>
                                Jalan yang setiap hari dilewati untuk{'\n'}berangkat ke tempat kerja.
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="location-sharp" size={20} color={Colors.neonLime} />
                                    <Text style={templateStyles.t4Location}> {data.league} Zone</Text>
                                </View>
                                <View>
                                    <Text style={templateStyles.t4RightText}>Simple Typography</Text>
                                    <Text style={templateStyles.t4RightText}>Made with Kynetix</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                );
            case 5: // STILL IN PROGRESS
                return (
                    <View style={templateStyles.fullScreen}>
                        <View style={[templateStyles.topNav, { marginTop: 60 }]}>
                            <Text style={[templateStyles.navItem, { opacity: 0.6 }]}>FEED</Text>
                            <View style={templateStyles.navItemActive}>
                                <Text style={templateStyles.navItem}>STORY</Text>
                            </View>
                            <Text style={[templateStyles.navItem, { opacity: 0.6 }]}>REELS</Text>
                        </View>

                        <View style={{ marginTop: 60, paddingHorizontal: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View>
                                    <Text style={templateStyles.t5SmallTitle}>STILL IN</Text>
                                    <View style={templateStyles.t5Line} />
                                    <Text style={templateStyles.t5BigTitle}>PROG</Text>
                                    <Text style={templateStyles.t5BigTitle}>RESS.</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 10 }}>
                                        <View style={[templateStyles.t5Dot, { backgroundColor: '#fff' }]} />
                                        <View style={templateStyles.t5Dot} />
                                        <View style={templateStyles.t5Dot} />
                                    </View>
                                    <Text style={templateStyles.t5Date}>{currentDay.substring(0, 6)}</Text>
                                    <Text style={templateStyles.t5DateNum}>{String(currentDate).padStart(2, '0')}</Text>
                                    <Text style={templateStyles.t5DateNum}>{String(now.getMonth() + 1).padStart(2, '0')}</Text>
                                    <Text style={templateStyles.t5DateNum}>{String(currentYear).slice(-2)}</Text>
                                    <View style={templateStyles.t5Tag}>
                                        <Text style={templateStyles.t5TagText}>IR3</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={templateStyles.t5Quote}>
                                GAK ADA DIDUNJA INI YANG NAMANYA KESUKSESAN YANG INSTAN{'\n'}
                                SEMUANYA PASTI DIDAPAT DENGAN USAHA & TERUS MENCOBA.
                            </Text>

                            <View style={{ marginTop: 'auto', marginBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <View>
                                    <Text style={templateStyles.t5Footer}>ARCHIVE BY {data.userName.toUpperCase()}</Text>
                                    <Text style={{ color: '#fff', fontSize: 20 }}>***</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={templateStyles.t5Footer}>AT Kynetix Club</Text>
                                    <Text style={templateStyles.t5SmallFooter}>CREATIVE STORY TYPOGRAPHY</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                );
            case 6: // ENERGY Graph
                return (
                    <View style={templateStyles.fullScreen}>
                        <View style={{ marginTop: 100, paddingHorizontal: 20 }}>
                            <Text style={templateStyles.t6Title}>
                                EVERY GOAL NEEDS YOUR <Text style={{ color: Colors.neonLime }}>ENERGY</Text>
                            </Text>
                        </View>

                        {/* SVG Graph Line - Fixed position across screen */}
                        <View style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.4, width: SCREEN_WIDTH, height: 200 }}>
                            <Svg height="100%" width="100%" viewBox="0 0 400 200">
                                <Path
                                    d="M0,150 Q50,150 80,120 T150,100 T250,130 T320,80 T400,110"
                                    fill="none"
                                    stroke={Colors.neonLime}
                                    strokeWidth="4"
                                />
                            </Svg>
                        </View>

                        <View style={{ marginTop: 'auto', marginBottom: 60, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                            <View>
                                <Text style={templateStyles.t6Label}>TIME</Text>
                                <Text style={templateStyles.t6Value}>16 HRS OF FOCUS</Text>
                            </View>
                            <View>
                                <Text style={templateStyles.t6Label}>PACE</Text>
                                <Text style={templateStyles.t6Value}>FAST & FOCUSED</Text>
                            </View>
                            <View>
                                <Text style={templateStyles.t6Label}>DISTANCE</Text>
                                <Text style={templateStyles.t6Value}>WORK → WORKOUT</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Text style={templateStyles.t6Brand}>KYNETIX</Text>
                            <Text style={templateStyles.t6Hashtag}>#CREATEWITHKYNETIX</Text>
                        </View>
                    </View>
                );
            case 7: // SPORTS TIME
                return (
                    <View style={templateStyles.fullScreen}>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            {/* Visual circle accent if no photo, but overlays photo nicely */}
                            <View style={templateStyles.t7Circle} />
                            <Text style={templateStyles.t7Title}>SPORTS TIME</Text>
                            <Text style={templateStyles.t7Subtitle}>TODAY'S ACTIVITY</Text>
                        </View>

                        <View style={{ marginBottom: 80, paddingHorizontal: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={templateStyles.t7Time}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} </Text>
                                <View style={templateStyles.t7Divider} />
                                <Text style={templateStyles.t7Date}> {currentDay} {currentDate} {currentMonth.substring(0, 3)}</Text>
                            </View>

                            <Text style={templateStyles.t7Quote}>
                                "One thing that you learn in sports:{'\n'}
                                you don't give up and you fight to the finish"
                            </Text>

                            <Text style={templateStyles.t7Footer}>instastory.by/{data.userName.toLowerCase()}</Text>
                        </View>
                    </View>
                );
            case 8: // THURSDAY MORNING (Active)
                return (
                    <View style={templateStyles.fullScreen}>
                        <View style={{ marginTop: 120, paddingHorizontal: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={templateStyles.t8Small}>reels</Text>
                                <View style={templateStyles.t8Pill}><Text style={templateStyles.t8PillText}>story</Text></View>
                                <Text style={templateStyles.t8Small}>feeds</Text>
                            </View>

                            <View style={{ marginTop: 60 }}>
                                <Text style={templateStyles.t8Day}>{currentDay}</Text>
                                <Text style={templateStyles.t8Morning}>MORNING.</Text>
                            </View>

                            <Text style={templateStyles.t8Time}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}</Text>
                        </View>

                        <View style={{ marginTop: 'auto', marginBottom: 60, alignItems: 'flex-end', paddingRight: 20 }}>
                            <Text style={templateStyles.t8Footer}>archive by {data.userName}</Text>
                            <Text style={templateStyles.t8SubFooter}>grading inside kynetix</Text>
                        </View>
                    </View>
                );
            case 9: // MORNING WALK
                return (
                    <View style={templateStyles.fullScreen}>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 80, gap: 20 }}>
                            <Text style={templateStyles.t9Nav}>Feeds</Text>
                            <Text style={templateStyles.t9Nav}>Story</Text>
                            <Text style={templateStyles.t9Nav}>Reels</Text>
                            <Text style={[templateStyles.t9Nav, { textDecorationLine: 'underline', fontWeight: 'bold' }]}>Post</Text>
                        </View>

                        <View style={{ marginTop: 'auto', marginBottom: 100, paddingHorizontal: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={templateStyles.t9Time}>05:30</Text>
                                <Text style={templateStyles.t9Am}>AM</Text>
                                <View style={templateStyles.t9Oval}>
                                    <Text style={templateStyles.t9OvalText}>MORNING</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={templateStyles.t9Walk}>WALK</Text>
                                <Ionicons name="arrow-forward" size={40} color="#fff" style={{ marginLeft: 10, marginTop: 10 }} />
                            </View>

                            <Text style={templateStyles.t9Quote}>
                                ONE STEP BETTER THAN BEFORE{'\n'}
                                REST HIDUP, SEMOGA KALI INI GAK ERROR{'\n'}
                                *****
                            </Text>

                            <Text style={templateStyles.t9Archive}>archive by {data.userName.toUpperCase()}</Text>
                        </View>
                    </View>
                );
            case 10: // LAST SUNDAY RIDE
                return (
                    <View style={templateStyles.fullScreen}>
                        <View style={{ marginTop: 'auto', marginBottom: 100, paddingLeft: 30 }}>
                            <View style={{ borderLeftWidth: 2, borderLeftColor: '#fff', paddingLeft: 10, marginBottom: 20 }}>
                                <Text style={templateStyles.t10DateNum}>{currentDate}</Text>
                                <Text style={templateStyles.t10Month}>{currentMonth.substring(0, 3)}</Text>
                            </View>

                            <Text style={templateStyles.t10Title}>Last Sunday</Text>
                            <Text style={templateStyles.t10Title}>Ride 2ⁿᵈ Month.</Text>

                            <View style={{ marginTop: 30, gap: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="location-sharp" size={16} color="#fff" />
                                    <Text style={templateStyles.t10Detail}> {data.league} Zone</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="time-outline" size={16} color="#fff" />
                                    <Text style={templateStyles.t10Detail}> Daylight</Text>
                                </View>
                            </View>

                            <Text style={templateStyles.t10Footer}>{currentYear} © // {data.userName.toLowerCase()}</Text>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <TouchableOpacity style={styles.triggerButton} onPress={requestPermission}>
                <Text style={styles.triggerText}>Grant Camera Permission</Text>
            </TouchableOpacity>
        );
    }

    return (
        <>
            <TouchableOpacity
                style={styles.triggerButton}
                onPress={() => setVisible(true)}
            >
                <Ionicons name="camera-outline" size={24} color={Colors.neonLime} />
                <Text style={styles.triggerText}>Create Story</Text>
            </TouchableOpacity>

            <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
                <View style={styles.container}>

                    {/* ViewShot captures this entire container */}
                    <ViewShot
                        ref={viewShotRef}
                        options={{ format: 'png', quality: 1, width: 1080, height: 1920 }}
                        style={styles.cameraContainer}
                    >
                        {capturedImage ? (
                            <Image
                                source={{ uri: capturedImage }}
                                style={[styles.camera, { resizeMode: 'cover' }]}
                            />
                        ) : (
                            <CameraView
                                ref={cameraRef}
                                style={styles.camera}
                                facing={cameraType}
                                enableTorch={flashMode === 'on'}
                            />
                        )}

                        {/* Overlay Template */}
                        <View style={styles.overlayContainer}>
                            {renderTemplate()}
                        </View>
                    </ViewShot>

                    {/* UI Controls (Not captured) */}
                    <SafeAreaView style={styles.uiOverlay}>

                        {/* Top Controls */}
                        <View style={styles.topControls}>
                            <TouchableOpacity onPress={() => setVisible(false)} style={styles.iconButton}>
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.topRightControls}>
                                <TouchableOpacity onPress={toggleFlash} style={styles.iconButton}>
                                    <Ionicons name={flashMode === 'on' ? "flash" : "flash-off"} size={26} color="#fff" />
                                </TouchableOpacity>
                                {capturedImage && (
                                    <TouchableOpacity onPress={resetCapture} style={styles.iconButton}>
                                        <Text style={{ color: '#fff', fontWeight: '600' }}>Retake</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Bottom Controls */}
                        {!capturedImage && (
                            <View style={styles.bottomControls}>

                                {/* Filter Carousel */}
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.filterContainer}
                                >
                                    {templates.map((t) => (
                                        <TouchableOpacity
                                            key={t.id}
                                            onPress={() => setSelectedTemplate(t.id)}
                                            style={[
                                                styles.filterItem,
                                                selectedTemplate === t.id && styles.filterItemActive
                                            ]}
                                        >
                                            <View style={[
                                                styles.filterCircle,
                                                selectedTemplate === t.id && styles.filterCircleActive
                                            ]}>
                                                <Ionicons name={t.icon as any} size={24} color={selectedTemplate === t.id ? '#000' : '#fff'} />
                                            </View>
                                            <Text style={[
                                                styles.filterName,
                                                selectedTemplate === t.id && styles.filterNameActive
                                            ]}>{t.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Shutter Area */}
                                <View style={styles.shutterArea}>
                                    <TouchableOpacity onPress={pickImage} style={styles.galleryButton}>
                                        <Ionicons name="images-outline" size={28} color="#fff" />
                                    </TouchableOpacity>

                                    {/* Big Shutter Button */}
                                    <TouchableOpacity onPress={handleShutterPress} disabled={isCapturing} style={styles.shutterButtonOuter}>
                                        <View style={[
                                            styles.shutterButtonInner,
                                            isCapturing && { backgroundColor: Colors.neonLime, transform: [{ scale: 0.8 }] }
                                        ]} />
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={toggleCameraType} style={styles.flipButton}>
                                        <Ionicons name="camera-reverse-outline" size={30} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Share Controls (Show only after capture) */}
                        {capturedImage && (
                            <View style={styles.bottomControls}>
                                <View style={styles.shutterArea}>
                                    <TouchableOpacity onPress={captureViewShotAndShare} style={[styles.shutterButtonOuter, { borderColor: Colors.neonLime, width: 200 }]}>
                                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Share Now 🚀</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                    </SafeAreaView>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    triggerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.black,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.neonLime,
    },
    triggerText: {
        color: Colors.neonLime,
        fontSize: 16,
        fontWeight: '600',
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    camera: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlayContainer: {
        flex: 1,
        justifyContent: 'space-between',
        zIndex: 10,
    },
    uiOverlay: {
        flex: 1,
        justifyContent: 'space-between',
        zIndex: 20,
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    topRightControls: {
        flexDirection: 'row',
        gap: 20,
    },
    iconButton: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        overflow: 'hidden',
    },
    bottomControls: {
        paddingBottom: 40,
        alignItems: 'center',
    },
    filterContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
        gap: 20,
    },
    filterItem: {
        alignItems: 'center',
        gap: 8,
    },
    filterItemActive: {
        transform: [{ scale: 1.1 }],
    },
    filterCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(50,50,50,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    filterCircleActive: {
        backgroundColor: Colors.neonLime,
        borderColor: '#fff',
    },
    filterName: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    filterNameActive: {
        color: '#fff',
    },
    shutterArea: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 40,
    },
    shutterButtonOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterButtonInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
    },
    galleryButton: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    flipButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const templateStyles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        padding: 30,
        backgroundColor: 'rgba(0,0,0,0.3)', // Slight dark overlay for text readability
    },
    // Template 1
    t1MonthYear: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    t1SmallText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    t1Day: { color: '#fff', fontSize: 62, fontWeight: '900', letterSpacing: -2, lineHeight: 70 },
    t1Quote: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 10, lineHeight: 14 },
    t1Footer: { color: '#fff', fontSize: 12, fontWeight: '700' },

    // Template 2
    t2Date: { color: '#fff', fontSize: 120, fontWeight: 'bold', lineHeight: 130 },
    t2Day: { color: '#fff', fontSize: 32, fontWeight: '600', lineHeight: 36 },
    t2Dots: { color: '#fff', fontSize: 30, marginTop: 10, fontWeight: 'bold' },
    t2Weather: { color: 'rgba(255,255,255,0.8)', fontSize: 10, textAlign: 'center', marginTop: 10 },
    t2Line: { width: 100, height: 2, backgroundColor: Colors.neonLime, marginTop: 30, marginBottom: 10 },
    t2Footer: { color: '#fff', fontSize: 10 },

    // Template 3
    t3copyright: { color: '#000', fontSize: 12, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 6 },
    t3Title: { color: '#000', fontSize: 64, fontWeight: '900', lineHeight: 60, textShadowColor: 'rgba(255,255,255,0.5)', textShadowRadius: 10 },
    t3Subtitle: { color: '#000', fontSize: 18, letterSpacing: 8, marginTop: 10, fontWeight: '300' },
    t3TimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 40, gap: 20 },
    t3Time: { color: '#000', fontSize: 24, fontWeight: '600' },
    t3Divider: { width: 2, height: 30, backgroundColor: '#000' },
    t3Day: { color: '#000', fontSize: 24, fontWeight: '400' },
    t3Message: { color: '#000', fontSize: 14, marginTop: 40, fontStyle: 'italic' },

    // Template 4
    t4DateTag: { backgroundColor: 'rgba(255,204,0,0.9)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 },
    t4DateText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
    t4Title: { color: '#fff', fontSize: 64, fontWeight: '900', lineHeight: 70 },
    t4Description: { color: '#fff', fontSize: 16, marginTop: 20, fontWeight: '500' },
    t4Location: { color: '#fff', fontSize: 14, fontWeight: '600' },
    t4RightText: { color: '#fff', fontSize: 10, textAlign: 'right', opacity: 0.8 },

    // Template 5
    topNav: { flexDirection: 'row', gap: 20, alignSelf: 'center' },
    navItem: { color: '#fff', fontSize: 14, fontWeight: '600' },
    navItemActive: { backgroundColor: '#D32F2F', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
    t5SmallTitle: { color: '#fff', fontSize: 32, fontWeight: '300' },
    t5Line: { width: 140, height: 2, backgroundColor: '#fff', marginVertical: 10 },
    t5BigTitle: { color: '#fff', fontSize: 100, fontWeight: '900', lineHeight: 90, letterSpacing: -4 },
    t5Dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    t5Date: { color: '#fff', fontSize: 12, marginBottom: 10, letterSpacing: 1 },
    t5DateNum: { color: '#fff', fontSize: 32, fontWeight: 'bold', lineHeight: 36 },
    t5Tag: { backgroundColor: '#D32F2F', paddingHorizontal: 8, paddingVertical: 2, marginTop: 20 },
    t5TagText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    t5Quote: { color: 'rgba(255,255,255,0.7)', fontSize: 10, maxWidth: 300, marginTop: 20, letterSpacing: 1 },
    t5Footer: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    t5SmallFooter: { color: 'rgba(255,255,255,0.6)', fontSize: 8, marginTop: 4 },

    // Template 6 (Energy)
    t6Title: { color: '#fff', fontSize: 40, fontWeight: '800', textAlign: 'center', lineHeight: 44 },
    t6Label: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 4 },
    t6Value: { color: '#fff', fontSize: 12, fontWeight: '700' },
    t6Brand: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
    t6Hashtag: { color: 'rgba(255,255,255,0.8)', fontSize: 12, alignSelf: 'center' },

    // Template 7 (Sport)
    t7Circle: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(204, 51, 51, 0.2)', position: 'absolute', top: -50 },
    t7Title: { color: '#fff', fontSize: 52, fontWeight: '900', fontStyle: 'italic', letterSpacing: -2 },
    t7Subtitle: { color: '#fff', fontSize: 14, letterSpacing: 6, fontWeight: '300', marginTop: 10 },
    t7Time: { color: '#fff', fontSize: 18, fontWeight: '700' },
    t7Divider: { width: 2, height: 16, backgroundColor: Colors.neonLime, marginHorizontal: 10 },
    t7Date: { color: '#fff', fontSize: 18, fontWeight: '400' },
    t7Quote: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontStyle: 'italic', textAlign: 'right', marginTop: 20, marginBottom: 20 },
    t7Footer: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'right' },

    // Template 8 (Active)
    t8Small: { color: '#fff', fontSize: 12, opacity: 0.8 },
    t8Pill: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    t8PillText: { color: '#000', fontSize: 10, fontWeight: '700' },
    t8Day: { color: '#fff', fontSize: 64, fontWeight: '900', letterSpacing: -2, lineHeight: 70 },
    t8Morning: { color: Colors.neonLime, fontSize: 64, fontWeight: '900', letterSpacing: -2, lineHeight: 70 },
    t8Time: { color: '#fff', fontSize: 24, fontWeight: '500', marginTop: 20 },
    t8Footer: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    t8SubFooter: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 },

    // Template 9 (Morning Walk)
    t9Nav: { color: '#fff', fontSize: 14, fontWeight: '500' },
    t9Time: { color: '#fff', fontSize: 16, fontWeight: '600' },
    t9Am: { color: '#fff', fontSize: 10, marginBottom: 4, marginLeft: 2 },
    t9Oval: { borderWidth: 1, borderColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginLeft: 15 },
    t9OvalText: { color: '#fff', fontSize: 10 },
    t9Walk: { color: '#fff', fontSize: 64, fontWeight: '900', letterSpacing: -1 },
    t9Quote: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 20, marginBottom: 40, letterSpacing: 1 },
    t9Archive: { color: '#D32F2F', fontSize: 10, fontWeight: 'bold' },

    // Template 10 (Ride)
    t10DateNum: { color: '#fff', fontSize: 32, fontWeight: '900', lineHeight: 32 },
    t10Month: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
    t10Title: { color: '#fff', fontSize: 36, fontWeight: '800', lineHeight: 40 },
    t10Detail: { color: '#fff', fontSize: 12, fontWeight: '600' },
    t10Footer: { color: '#fff', fontSize: 10, marginTop: 30, fontWeight: 'bold' },
});
