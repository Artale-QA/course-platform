package com.example.course_platform.service;

import com.example.course_platform.dto.CoursePreviewDto;
import com.example.course_platform.entity.Course;
import com.example.course_platform.repository.CourseRepository;
import com.example.course_platform.repository.LessonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private LessonRepository lessonRepository;

    @InjectMocks
    private CourseService courseService;

    private Course course;

    @BeforeEach
    void setUp() {
        course = new Course();
        course.setId(1L);
        course.setTitle("Test Course");
        course.setDescription("Test Description");
    }

    @Test
    void getAllCourses_ShouldReturnList() {
        when(courseRepository.findAll()).thenReturn(Arrays.asList(course));

        List<Course> courses = courseService.getAllCourses();

        assertFalse(courses.isEmpty());
        assertEquals(1, courses.size());
        assertEquals("Test Course", courses.get(0).getTitle());
    }

    @Test
    void getCourseById_ShouldReturnCourse() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

        Course found = courseService.getCourseById(1L);

        assertNotNull(found);
        assertEquals("Test Course", found.getTitle());
    }

    @Test
    void getCourseById_WhenNotFound_ShouldThrowException() {
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> courseService.getCourseById(99L));
    }

    @Test
    void createCourse_ShouldSaveAndReturn() {
        when(courseRepository.save(any(Course.class))).thenReturn(course);

        Course created = courseService.createCourse(course);

        assertNotNull(created);
        assertEquals("Test Course", created.getTitle());
    }

    @Test
    void deleteCourse_ShouldDelete() {
        doNothing().when(courseRepository).deleteById(1L);

        assertDoesNotThrow(() -> courseService.deleteCourse(1L));
        verify(courseRepository, times(1)).deleteById(1L);
    }
}